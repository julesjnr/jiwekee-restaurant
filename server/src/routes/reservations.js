import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireStaff, optionalAuth } from "../middleware/auth.js";
import { logAudit, pushNotification } from "./auth.js";
import { sendBookingConfirmationEmail } from "../services/emailService.js";

const router = Router();

// GET /api/reservations/my — customer's bookings from database
router.get("/my", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.user_id,
         r.customer_name,
         r.phone,
         r.email,
         to_char(r.reservation_date, 'YYYY-MM-DD') AS reservation_date,
         r.reservation_time,
         r.guests_count AS guest_count,
         r.table_id,
         r.table_number,
         r.special_requests,
         r.status,
         r.created_at,
         r.updated_at
       FROM reservations r
       WHERE r.user_id = $1
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [req.user.id]
    );

    res.json({ reservations: result.rows });
  } catch (err) {
    console.error("Fetch my reservations error:", err);
    res.status(500).json({ error: "Could not load reservations from database." });
  }
});

// GET /api/reservations — staff view all bookings with filters
router.get("/", requireStaff, async (req, res) => {
  try {
    const { date, status } = req.query;

    const conditions = [];
    const params = [];

    if (date) {
      params.push(date);
      conditions.push("r.reservation_date = $" + params.length + "::date");
    }
    if (status) {
      params.push(status.trim().toLowerCase());
      conditions.push("LOWER(r.status) = $" + params.length);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const query = `
      SELECT
        r.id,
        r.user_id,
        r.customer_name,
        r.phone,
        r.email,
        to_char(r.reservation_date, 'YYYY-MM-DD') AS reservation_date,
        r.reservation_time,
        r.guests_count AS guest_count,
        r.table_id,
        r.table_number,
        r.special_requests,
        r.status,
        r.created_at,
        r.updated_at
      FROM reservations r
      ${whereClause}
      ORDER BY r.reservation_date DESC, r.reservation_time DESC
    `;

    const result = await pool.query(query, params);
    res.json({ reservations: result.rows });
  } catch (err) {
    console.error("Fetch reservations error:", err);
    res.status(500).json({ error: "Could not fetch reservations." });
  }
});

// POST /api/reservations — book a table
router.post("/", optionalAuth, async (req, res) => {
  const { customer_name, phone, email, reservation_date, reservation_time, guest_count, guests_count, table_id, special_requests } = req.body;

  const count = Number(guests_count || guest_count) || 2;

  if (!customer_name || !phone || !reservation_date || !reservation_time) {
    return res.status(400).json({ error: "Name, phone, date, and time are required." });
  }

  try {
    // Check conflict if table_id is chosen
    if (table_id) {
      const conflictRes = await pool.query(
        `SELECT id FROM reservations
         WHERE table_id = $1
           AND reservation_date = $2::date
           AND reservation_time = $3
           AND status IN ('Pending', 'Confirmed', 'Seated')`,
        [Number(table_id), reservation_date, reservation_time]
      );
      if (conflictRes.rows.length > 0) {
        return res.status(400).json({
          error: "This table is already reserved for the selected date and time. Please choose another table or time slot.",
        });
      }
    }

    let resolvedTableId = null;
    let resolvedTableNumber = null;

    if (table_id) {
      const tableRes = await pool.query(
        "SELECT id, table_number FROM restaurant_tables WHERE id = $1",
        [Number(table_id)]
      );
      if (tableRes.rows.length > 0) {
        resolvedTableId = tableRes.rows[0].id;
        resolvedTableNumber = tableRes.rows[0].table_number;
      }
    }

    const insertRes = await pool.query(
      `INSERT INTO reservations (user_id, customer_name, phone, email, reservation_date, reservation_time, guests_count, table_id, table_number, special_requests, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')
       RETURNING id, user_id, customer_name, phone, email, to_char(reservation_date, 'YYYY-MM-DD') AS reservation_date, reservation_time, guests_count AS guest_count, table_id, table_number, special_requests, status, created_at, updated_at`,
      [
        req.user?.id || null,
        customer_name.trim(),
        phone.trim(),
        email ? email.trim() : null,
        reservation_date,
        reservation_time,
        count,
        resolvedTableId,
        resolvedTableNumber,
        special_requests ? special_requests.trim() : null,
      ]
    );

    const reservation = insertRes.rows[0];

    await logAudit({
      userId: req.user?.id,
      userName: customer_name,
      action: "RESERVATION_CREATED",
      entity: "reservations",
      entityId: reservation.id,
      details: `Reservation booked by ${customer_name} for ${count} guests on ${reservation_date} at ${reservation_time}`,
    });

    await pushNotification({
      title: "New Table Reservation Request",
      message: `${customer_name} booked for ${count} guests on ${reservation_date} at ${reservation_time}.`,
      type: "reservation",
      linkUrl: "/admin?tab=reservations",
    });

    // Send Booking Confirmation Email if recipient email is available
    const recipientEmail = email || req.user?.email;
    if (recipientEmail) {
      sendBookingConfirmationEmail({
        email: recipientEmail,
        name: customer_name,
        reservation,
      }).catch((err) => console.error("[Booking Email Error]", err.message));
    }

    res.status(201).json({
      reservation,
      message: "Reservation request received! Our staff will confirm your booking shortly.",
    });
  } catch (err) {
    console.error("Create reservation error:", err);
    res.status(500).json({ error: "Failed to create reservation." });
  }
});

// PATCH /api/reservations/:id/status — staff update reservation status
router.patch("/:id/status", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { status, table_id } = req.body;

  try {
    const existingRes = await pool.query("SELECT * FROM reservations WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    const prev = existingRes.rows[0];

    let newTableId = prev.table_id;
    let newTableNumber = prev.table_number;

    if (table_id !== undefined && table_id !== null) {
      const tableRes = await pool.query("SELECT id, table_number FROM restaurant_tables WHERE id = $1", [Number(table_id)]);
      if (tableRes.rows.length > 0) {
        newTableId = tableRes.rows[0].id;
        newTableNumber = tableRes.rows[0].table_number;

        if (status === "Seated") {
          await pool.query("UPDATE restaurant_tables SET status = 'Occupied', updated_at = now() WHERE id = $1", [newTableId]);
        } else if (status === "Confirmed") {
          await pool.query("UPDATE restaurant_tables SET status = 'Reserved', updated_at = now() WHERE id = $1", [newTableId]);
        }
      }
    }

    const updateRes = await pool.query(
      `UPDATE reservations
       SET
         status = COALESCE($1, status),
         table_id = $2,
         table_number = $3,
         updated_at = now()
       WHERE id = $4
       RETURNING id, user_id, customer_name, phone, email, to_char(reservation_date, 'YYYY-MM-DD') AS reservation_date, reservation_time, guests_count AS guest_count, table_id, table_number, special_requests, status, created_at, updated_at`,
      [status || null, newTableId, newTableNumber, id]
    );

    const updated = updateRes.rows[0];

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "RESERVATION_STATUS_CHANGED",
      entity: "reservations",
      entityId: id,
      details: `Reservation #${id} for ${prev.customer_name} changed from '${prev.status}' to '${updated.status}'`,
    });

    res.json({ reservation: updated });
  } catch (err) {
    console.error("Update reservation error:", err);
    res.status(500).json({ error: "Failed to update reservation." });
  }
});

export default router;
