import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Reservations() {
  const { user } = useAuth();
  const [myReservations, setMyReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const defaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    customer_name: user?.name || "",
    customer_phone: user?.phone || "",
    reservation_date: defaultDate(),
    reservation_time: "19:00",
    guest_count: 2,
    special_requests: "",
  });

  const fetchMyBookings = useCallback(() => {
    api
      .getMyReservations()
      .then((data) => setMyReservations(data.reservations || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || "",
        customer_phone: prev.customer_phone || user.phone || "",
      }));
      fetchMyBookings();
    }
  }, [user, fetchMyBookings]);

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const data = await api.bookReservation(formData);
      setSuccessMsg(
        `Table reservation confirmed! Booking #${data.reservation.id} for ${formData.guest_count} guests on ${formData.reservation_date} at ${formData.reservation_time}.`
      );
      setFormData({
        customer_name: user?.name || "",
        customer_phone: user?.phone || "",
        reservation_date: defaultDate(),
        reservation_time: "19:00",
        guest_count: 2,
        special_requests: "",
      });
      fetchMyBookings();
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit table reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "1160px", margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div className="section-eyebrow">TABLE RESERVATIONS</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "34px", color: "var(--color-primary)", marginBottom: "10px" }}>
          Reserve a Table at Jiwekee
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "15px", maxWidth: "620px", margin: "0 auto" }}>
          Experience authentic Swahili cuisine and artisanal open-flame Nyama Choma in our ambient dining rooms or open terrace garden.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "36px",
          alignItems: "start",
        }}
      >
        {/* Booking Form Card */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)", fontSize: "20px", marginBottom: "20px" }}>
            Table Reservation Details
          </h2>

          {successMsg && <div className="form-success">{successMsg}</div>}
          {errorMsg && <div className="form-error">{errorMsg}</div>}

          <form onSubmit={handleBook}>
            <div className="form-input-group">
              <label>Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Samuel Mutiso"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>

            <div className="form-input-group">
              <label>Phone Number (M-Pesa / SMS Confirmation) *</label>
              <input
                type="tel"
                required
                placeholder="0712345678"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-input-group">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                />
              </div>

              <div className="form-input-group">
                <label>Time Slot *</label>
                <input
                  type="time"
                  required
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                />
              </div>
            </div>

            <div className="form-input-group">
              <label>Number of Guests *</label>
              <input
                type="number"
                min="1"
                max="25"
                required
                value={formData.guest_count}
                onChange={(e) => setFormData({ ...formData, guest_count: Number(e.target.value) })}
              />
            </div>

            <div className="form-input-group">
              <label>Special Requests or Dietary Requirements</label>
              <textarea
                rows="3"
                className="custom-textarea"
                placeholder="e.g. Terrace seating, birthday cake service, baby high chair needed"
                value={formData.special_requests}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-add-cart"
              style={{ width: "100%", padding: "14px", marginTop: "14px", fontSize: "15px" }}
            >
              {loading ? "Confirming Table..." : "Book Table Reservation →"}
            </button>
          </form>
        </div>

        {/* Info & Customer's Bookings Column */}
        <div>
          {/* Highlights Card */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              marginBottom: "24px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 style={{ color: "var(--color-accent)", fontSize: "16px", fontWeight: "700", marginBottom: "14px" }}>
              Dining Highlights
            </h3>
            <ul style={{ listStyle: "none", color: "var(--color-text-muted)", fontSize: "13.5px", lineHeight: "1.8" }}>
              <li><strong>Location:</strong> Ngong Road, Kilimani, Nairobi</li>
              <li><strong>Hours:</strong> Open daily from 11:00 AM to 11:00 PM</li>
              <li><strong>Specialties:</strong> Charcoal Nyama Choma, Swahili Biryani, Fresh Tilapia</li>
              <li><strong>Parking:</strong> Secure on-premise guest and valet parking</li>
            </ul>
          </div>

          {/* User's Upcoming Bookings */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "26px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 style={{ color: "var(--color-primary)", fontSize: "16.5px", fontWeight: "700", marginBottom: "16px" }}>
              My Table Bookings
            </h3>

            {!user ? (
              <div style={{ color: "var(--color-text-muted)", fontSize: "13.5px" }}>
                <Link to="/login" style={{ color: "var(--color-accent)", fontWeight: "700" }}>
                  Sign in
                </Link>{" "}
                to view your saved reservations and earn loyalty rewards on your visits!
              </div>
            ) : myReservations.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "13.5px" }}>
                You have no upcoming table reservations.
              </p>
            ) : (
              <div>
                {myReservations.map((res) => (
                  <div
                    key={res.id}
                    style={{
                      background: "var(--color-surface-soft)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px 16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ fontWeight: "700", color: "var(--color-primary)", fontSize: "14px" }}>
                        Booking #{res.id} ({res.guest_count} Guests)
                      </span>
                      <span className={`status-badge status-${res.status.toLowerCase()}`}>
                        {res.status}
                      </span>
                    </div>
                    <div style={{ color: "var(--color-accent)", fontSize: "13px", fontWeight: "600" }}>
                      {res.reservation_date} at {res.reservation_time}
                    </div>
                    {res.special_requests && (
                      <div style={{ color: "var(--color-text-muted)", fontSize: "12px", marginTop: "6px" }}>
                        Note: {res.special_requests}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
