import jwt from "jsonwebtoken";

const COOKIE_NAME = process.env.COOKIE_NAME || "jiwekee_token";
const JWT_SECRET = process.env.JWT_SECRET || "jiwekee-secret-jwt-key-development";
const IS_PROD = (process.env.NODE_ENV || "development") === "production";

export function requireAuth(req, res, next) {
  // Support cookie-based auth (httpOnly cookie) and Authorization header as fallback
  let token = req.cookies?.[COOKIE_NAME];
  if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ error: "Please log in to continue." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, name, email, role, is_admin }
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

export function requireStaff(req, res, next) {
  requireAuth(req, res, () => {
    const staffRoles = ["owner", "manager", "cashier", "kitchen", "waiter", "accountant", "admin"];
    const userRole = (req.user?.role || "").toLowerCase();
    if (req.user?.is_admin || staffRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({ error: "Access denied. Restaurant staff credentials required." });
  });
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const userRole = (req.user?.role || "").toLowerCase();
      if (req.user?.is_admin || userRole === "owner" || allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
        return next();
      }
      return res.status(403).json({
        error: `Access restricted to roles: ${allowedRoles.join(", ")}.`,
      });
    });
  };
}

export function optionalAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    // ignore invalid/expired token
  }
  next();
}

export function issueToken(res, user) {
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || (user.is_admin ? "owner" : "customer"),
      is_admin: Boolean(user.is_admin || user.role === "owner"),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD, // use secure cookies in production
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  // Also return the token string so APIs or scripts can use Bearer tokens if desired
  return token;
}

export function clearToken(res) {
  res.clearCookie(COOKIE_NAME);
}
