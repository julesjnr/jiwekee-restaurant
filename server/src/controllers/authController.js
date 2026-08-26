import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { issueToken, clearToken } from "../middleware/auth.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailService.js";

// Helper to write audit logs directly to PostgreSQL
export async function logAudit({ userId, userName, action, entity, entityId, details }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, userName || "System", action, entity, String(entityId || ""), details || ""]
    );
  } catch (err) {
    console.error("[AuditLog Error]", err.message);
  }
}

// Helper to push system notifications directly to PostgreSQL
export async function pushNotification({ title, message, type = "info", linkUrl = "/admin" }) {
  try {
    await pool.query(
      `INSERT INTO system_notifications (title, message, type, is_read, link_url)
       VALUES ($1, $2, $3, false, $4)`,
      [title, message, type, linkUrl]
    );
  } catch (err) {
    console.error("[Notification Error]", err.message);
  }
}

/**
 * POST /api/auth/login
 * Customer and general user authentication
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE lower(email) = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
    }

    const token = issueToken(res, user);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "USER_LOGIN",
      entity: "users",
      entityId: user.id,
      details: `User signed in successfully: ${user.email} (Role: ${user.role})`,
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet_balance: Number(user.wallet_balance),
        loyalty: user.loyalty,
        loyalty_points: Number(user.loyalty_points),
        loyalty_tier: user.loyalty_tier,
        role: user.role,
        is_admin: Boolean(user.is_admin || user.role === "owner" || user.role === "manager"),
        phone: user.phone,
      },
      token,
    });
  } catch (err) {
    console.error("Login controller error:", err);
    return res.status(500).json({ error: "Something went wrong logging you in. Please try again." });
  }
}

/**
 * POST /api/auth/register (also /api/auth/signup)
 * Customer registration
 */
export async function register(req, res) {
  const { name, email, password, confirmPassword, loyalty, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match. Please re-type your passwords carefully." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE lower(email) = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `The email address ${email} is already registered.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initialWallet = 0.0;
    const initialPoints = loyalty ? 50 : 0;
    const loyaltyTier = "Bronze";

    const insertResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, loyalty, wallet_balance, loyalty_points, loyalty_tier, role, is_admin, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, loyalty, wallet_balance, loyalty_points, loyalty_tier, role, is_admin, phone, created_at`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        Boolean(loyalty),
        initialWallet,
        initialPoints,
        loyaltyTier,
        "customer",
        false,
        phone ? phone.trim() : null,
      ]
    );

    const user = insertResult.rows[0];
    const token = issueToken(res, user);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "USER_SIGNUP",
      entity: "users",
      entityId: user.id,
      details: `New customer registered: ${user.name} (${user.email}) - Loyalty: ${Boolean(loyalty)}`,
    });

    await pushNotification({
      title: "New Customer Registration",
      message: `${user.name} joined Jiwekee Restaurant.`,
      type: "info",
      linkUrl: "/admin?tab=crm",
    });

    // Send Welcome Email in background
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      loyaltyPoints: user.loyalty_points,
      walletBalance: user.wallet_balance,
    }).catch((err) => console.error("[Welcome Email Error]", err.message));

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        loyalty: user.loyalty,
        wallet_balance: Number(user.wallet_balance),
        loyalty_points: Number(user.loyalty_points),
        loyalty_tier: user.loyalty_tier,
        role: user.role,
        is_admin: Boolean(user.is_admin),
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Register controller error:", err);
    return res.status(500).json({ error: "Something went wrong creating your account." });
  }
}

/**
 * POST /api/auth/admin-login
 * Staff and administrative authentication
 */
export async function adminLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Staff email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE lower(email) = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid staff credentials." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid staff credentials." });
    }

    const staffRoles = ["owner", "manager", "cashier", "kitchen", "waiter", "accountant", "admin"];
    const userRole = (user.role || "").toLowerCase();
    const isStaff = user.is_admin || staffRoles.includes(userRole);

    if (!isStaff || userRole === "customer") {
      return res.status(403).json({
        error: "Access denied: This account is registered as a customer. This portal is strictly restricted to restaurant staff and administrative personnel.",
      });
    }

    const token = issueToken(res, user);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "STAFF_PORTAL_LOGIN",
      entity: "auth",
      entityId: user.id,
      details: `Staff member ${user.name} logged into management portal with role: ${user.role || "staff"}`,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet_balance: Number(user.wallet_balance),
        loyalty: user.loyalty,
        loyalty_points: Number(user.loyalty_points),
        loyalty_tier: user.loyalty_tier,
        role: user.role,
        is_admin: Boolean(user.is_admin || user.role === "owner" || user.role === "manager"),
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Something went wrong verifying staff credentials." });
  }
}

/**
 * POST /api/auth/switch-demo-role
 * Quick demo role switcher for testing
 */
export async function switchDemoRole(req, res) {
  const { role } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1",
      [role || "owner"]
    );

    let targetUser = result.rows[0];
    if (!targetUser) {
      const fallback = await pool.query("SELECT * FROM users ORDER BY id ASC LIMIT 1");
      targetUser = fallback.rows[0];
    }

    if (!targetUser) {
      return res.status(404).json({ error: "Role user not found" });
    }

    const token = issueToken(res, targetUser);
    return res.json({
      token,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        wallet_balance: Number(targetUser.wallet_balance),
        loyalty: targetUser.loyalty,
        loyalty_points: Number(targetUser.loyalty_points),
        loyalty_tier: targetUser.loyalty_tier,
        role: targetUser.role,
        is_admin: Boolean(targetUser.is_admin || targetUser.role === "owner" || targetUser.role === "manager"),
        phone: targetUser.phone,
      },
    });
  } catch (err) {
    console.error("Switch role error:", err);
    return res.status(500).json({ error: "Failed to switch role." });
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(_req, res) {
  clearToken(res);
  return res.json({ ok: true, message: "Logged out successfully." });
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, loyalty, wallet_balance, loyalty_points, loyalty_tier, role, is_admin, phone, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const user = result.rows[0];
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet_balance: Number(user.wallet_balance),
        loyalty: user.loyalty,
        loyalty_points: Number(user.loyalty_points),
        loyalty_tier: user.loyalty_tier,
        role: user.role,
        is_admin: Boolean(user.is_admin || user.role === "owner" || user.role === "manager"),
        phone: user.phone,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Auth /me error:", err);
    return res.status(500).json({ error: "Could not load user profile." });
  }
}

/**
 * GET /api/auth/staff
 */
export async function getStaff(_req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_admin, phone, created_at 
       FROM users 
       WHERE role != 'customer' OR is_admin = TRUE 
       ORDER BY id ASC`
    );
    return res.json({ staff: result.rows });
  } catch (err) {
    console.error("Get staff error:", err);
    return res.status(500).json({ error: "Could not retrieve staff directory." });
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userRes = await pool.query(
      "SELECT id, name, email FROM users WHERE lower(email) = $1",
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.json({
        ok: true,
        message: "If an account with that email exists, a password reset link has been created.",
      });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Invalidate previous unused tokens for this user
    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE, updated_at = now() WHERE user_id = $1 AND used = FALSE",
      [user.id]
    );

    // Save new reset token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;

    console.log(`[Password Reset] Reset link for ${user.email}: ${resetUrl}`);

    // Send Password Reset Email in background
    sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
      resetToken,
    }).catch((err) => console.error("[Password Reset Email Error]", err.message));

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "FORGOT_PASSWORD_REQUEST",
      entity: "users",
      entityId: user.id,
      details: `Password reset requested for ${user.email}`,
    });

    return res.json({
      ok: true,
      message: "If an account with that email exists, a password reset link has been created.",
      token: resetToken,
      resetUrl,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Failed to process password reset request." });
  }
}

/**
 * GET /api/auth/verify-reset-token/:token
 */
export async function verifyResetToken(req, res) {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ error: "Reset token is required." });
  }

  try {
    const tokenRes = await pool.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used, u.email, u.name
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = $1`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or nonexistent password reset token." });
    }

    const row = tokenRes.rows[0];
    if (row.used) {
      return res.status(400).json({ error: "This password reset link has already been used." });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: "This password reset link has expired. Please request a new one." });
    }

    return res.json({
      ok: true,
      valid: true,
      email: row.email,
      name: row.name,
    });
  } catch (err) {
    console.error("Verify token error:", err);
    return res.status(500).json({ error: "Failed to verify reset token." });
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(req, res) {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and new password are required." });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  try {
    const tokenRes = await pool.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used, u.name, u.email
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = $1`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or nonexistent password reset token." });
    }

    const row = tokenRes.rows[0];
    if (row.used) {
      return res.status(400).json({ error: "This reset link has already been used." });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: "This reset link has expired. Please request a new one." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
      [passwordHash, row.user_id]
    );

    // Mark token as used
    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE, updated_at = now() WHERE id = $1",
      [row.id]
    );

    await logAudit({
      userId: row.user_id,
      userName: row.name,
      action: "PASSWORD_RESET_SUCCESS",
      entity: "users",
      entityId: row.user_id,
      details: `Password reset successfully for ${row.email}`,
    });

    return res.json({
      ok: true,
      message: "Your password has been successfully reset. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Failed to reset password." });
  }
}
