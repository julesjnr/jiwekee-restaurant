import { Router } from "express";
import { pool } from "../db/pool.js";
import { sendPaymentReceiptEmail } from "../services/emailService.js";

const router = Router();

function isConfigured() {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_SHORTCODE &&
      (process.env.MPESA_CALLBACK_URL || process.env.MPESA_CALLBACK)
  );
}

async function getAccessToken() {
  const env = process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || "sandbox";
  const base = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const resp = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!resp.ok) throw new Error("Failed to authenticate with M-Pesa.");
  const data = await resp.json();
  return data.access_token;
}

function formatPhone(rawPhone) {
  // Normalizes 07xxxxxxxx / 7xxxxxxxx / 2547xxxxxxxx into 2547xxxxxxxx
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return `254${digits}`;
}

// Called from routes/orders.js during checkout.
// Returns { checkoutRequestId, message }. Falls back to a mock response when
// Daraja credentials aren't configured, so the app runs end-to-end locally.
export async function initiateStkPush({ amount, phone, orderId }) {
  const formattedPhone = formatPhone(phone);

  if (!isConfigured()) {
    console.log(
      `[MPESA MOCK] Would send STK push for KES ${amount} to ${formattedPhone} (order #${orderId})`
    );
    return {
      checkoutRequestId: `MOCK-${orderId}-${Date.now()}`,
      message: "STK push sent (mock mode — set MPESA_* env vars for real Daraja calls).",
    };
  }

  const env = process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || "sandbox";
  const base = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
  const accessToken = await getAccessToken();

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const bodyPayload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL || process.env.MPESA_CALLBACK,
    AccountReference: `Order${orderId}`,
    TransactionDesc: "Jiwekee Restaurant order",
  };

  console.debug("[MPESA] STK push request:", bodyPayload);

  const resp = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  const data = await resp.json().catch((e) => {
    console.error("[MPESA] Failed to parse STK response JSON", e);
    throw new Error("Failed to parse M-Pesa response.");
  });

  console.debug("[MPESA] STK push response:", data);

  // Daraja may return numeric 0 or string "0" for ResponseCode
  const respCode = data.ResponseCode ?? data.responseCode ?? null;
  if (respCode === null || (String(respCode) !== "0" && String(respCode) !== "")) {
    const errMsg = data.errorMessage || data.error_description || data.ResponseDescription || JSON.stringify(data);
    throw new Error(`M-Pesa STK push failed: ${errMsg}`);
  }

  return {
    checkoutRequestId: data.CheckoutRequestID || data.checkoutRequestID || data.CheckoutRequestId || null,
    message: data.ResponseDescription || data.responseDescription || "STK push request accepted.",
  };
}

// Safaricom calls this webhook after the customer completes (or cancels) the STK prompt.
router.post("/callback", async (req, res) => {
  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) return res.sendStatus(400);

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;
    const status = ResultCode === 0 ? "Paid" : "Failed";

    let mpesaReceipt = null;
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const receiptItem = CallbackMetadata.Item.find((i) => i.Name === "MpesaReceiptNumber");
      mpesaReceipt = receiptItem?.Value ?? null;
    }

    await pool.query(
      "UPDATE orders SET status = $1, mpesa_receipt = $2 WHERE checkout_id = $3",
      [status, mpesaReceipt, CheckoutRequestID]
    );

    if (ResultCode === 0) {
      // Update payments table and send receipt email in background
      (async () => {
        try {
          const orderRes = await pool.query(
            `SELECT o.id, o.amount, o.order_type, o.table_number, o.delivery_address, o.payment_method, u.email, u.name
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.checkout_id = $1`,
            [CheckoutRequestID]
          );

          if (orderRes.rows.length > 0) {
            const orderData = orderRes.rows[0];

            await pool.query(
              `UPDATE payments SET payment_status = 'Completed', transaction_id = $1
               WHERE order_id = $2`,
              [mpesaReceipt || `MPESA-${orderData.id}`, orderData.id]
            );

            // Fetch order items
            const itemsRes = await pool.query(
              "SELECT name, quantity, unit_price FROM order_items WHERE order_id = $1",
              [orderData.id]
            );
            orderData.items = itemsRes.rows;

            if (orderData.email) {
              await sendPaymentReceiptEmail({
                email: orderData.email,
                name: orderData.name,
                order: orderData,
                payment: {
                  transaction_id: mpesaReceipt || `MPESA-${orderData.id}`,
                  amount: orderData.amount,
                  payment_method: "mpesa",
                },
              });
            }
          }
        } catch (mailErr) {
          console.error("[M-Pesa Receipt Email Error]", mailErr.message);
        }
      })();
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    res.sendStatus(500);
  }
});

// Local helper to simulate a Safaricom callback during development.
// POST /api/mpesa/simulate-callback
router.post("/simulate-callback", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Simulation disabled in production." });
  }

  try {
    const { CheckoutRequestID, ResultCode = 0, MpesaReceiptNumber } = req.body;
    if (!CheckoutRequestID) return res.status(400).json({ error: "CheckoutRequestID is required." });

    const status = Number(ResultCode) === 0 ? "Paid" : "Failed";
    const mpesaReceipt = MpesaReceiptNumber || null;

    await pool.query(
      "UPDATE orders SET status = $1, mpesa_receipt = $2 WHERE checkout_id = $3",
      [status, mpesaReceipt, CheckoutRequestID]
    );

    return res.json({ ok: true, message: `Simulated callback applied for ${CheckoutRequestID}` });
  } catch (err) {
    console.error("Simulate callback error:", err);
    res.status(500).json({ error: "Simulation failed." });
  }
});

export default router;
