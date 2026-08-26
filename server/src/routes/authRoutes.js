import { Router } from "express";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import {
  login,
  register,
  adminLogin,
  switchDemoRole,
  logout,
  getMe,
  getStaff,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  logAudit,
  pushNotification,
} from "../controllers/authController.js";
import {
  verifyTransporter,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
} from "../services/emailService.js";

const router = Router();

// Re-export audit and notification helpers
export { logAudit, pushNotification };

// Core authentication routes
router.post("/login", login);
router.post("/register", register);
router.post("/signup", register); // Alias for signup
router.post("/admin-login", adminLogin);
router.post("/switch-demo-role", switchDemoRole);
router.post("/logout", logout);

// Profile and staff routes
router.get("/me", requireAuth, getMe);
router.get("/staff", requireAuth, getStaff);

// Password recovery routes
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password", resetPassword);

// Email verification & diagnostic routes
router.get("/email-status", async (_req, res) => {
  const status = await verifyTransporter();
  res.json(status);
});

router.post("/test-email", async (req, res) => {
  const { type = "welcome", email, name = "Valued Guest" } = req.body;
  const targetEmail = email || "guest@example.com";

  try {
    let result;
    switch (type) {
      case "welcome":
        result = await sendWelcomeEmail({
          email: targetEmail,
          name,
          loyaltyPoints: 50,
          walletBalance: 0,
        });
        break;
      case "reset":
        result = await sendPasswordResetEmail({
          email: targetEmail,
          name,
          resetUrl: "http://localhost:3000/reset-password/sample-token-12345",
          resetToken: "sample-token-12345",
        });
        break;
      case "order":
        result = await sendOrderConfirmationEmail({
          email: targetEmail,
          name,
          order: {
            id: 101,
            amount: 2450.0,
            status: "Confirmed",
            payment_method: "mpesa",
            order_type: "Dine-In",
            table_number: "T-04",
            points_earned: 24,
            items: [
              { name: "Kuku Choma (Half)", quantity: 1, unit_price: 950 },
              { name: "Swahili Pilau Bowl", quantity: 2, unit_price: 650 },
              { name: "Fresh Passion Juice", quantity: 2, unit_price: 100 },
            ],
          },
        });
        break;
      case "booking":
        result = await sendBookingConfirmationEmail({
          email: targetEmail,
          name,
          reservation: {
            id: 55,
            reservation_date: "2026-08-30",
            reservation_time: "19:30",
            guests_count: 4,
            table_number: "T-08 (VIP Corner)",
            status: "Confirmed",
            special_requests: "Window seat for anniversary dinner",
          },
        });
        break;
      case "receipt":
        result = await sendPaymentReceiptEmail({
          email: targetEmail,
          name,
          order: {
            id: 101,
            amount: 2450.0,
            payment_method: "mpesa",
            mpesa_receipt: "QGH89765TR",
            items: [
              { name: "Kuku Choma (Half)", quantity: 1, unit_price: 950 },
              { name: "Swahili Pilau Bowl", quantity: 2, unit_price: 650 },
              { name: "Fresh Passion Juice", quantity: 2, unit_price: 100 },
            ],
          },
          payment: {
            transaction_id: "QGH89765TR",
            amount: 2450.0,
            payment_method: "mpesa",
          },
        });
        break;
      default:
        return res.status(400).json({ error: `Unknown email type: ${type}` });
    }

    res.json({
      ok: true,
      type,
      recipient: targetEmail,
      result,
      message: `Test email (${type}) processed successfully.`,
    });
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).json({ error: "Failed to dispatch test email." });
  }
});

export default router;
