import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    navigate("/login");
  }

  const isStaff = Boolean(user && (user.is_admin || (user.role && user.role !== "customer")));

  return (
    <header className="restoran-navbar">
      <div className="restoran-navbar-inner">
        {/* Restoran Brand Logo */}
        <NavLink to="/" className="restoran-brand" onClick={() => setMobileOpen(false)}>
          <i className="fa fa-utensils"></i>
          <div>
            <span className="restoran-brand-title">Jiwekee</span>
            <span className="restoran-brand-subtitle">Tavern & Grill</span>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <ul className="restoran-nav-menu" style={{ margin: 0, padding: 0 }}>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `restoran-nav-link ${isActive ? "active" : ""}`}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/menu"
              className={({ isActive }) => `restoran-nav-link ${isActive ? "active" : ""}`}
            >
              Menu
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reservations"
              className={({ isActive }) => `restoran-nav-link ${isActive ? "active" : ""}`}
            >
              Booking
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `restoran-nav-link ${isActive ? "active" : ""}`}
            >
              Loyalty & Wallet
            </NavLink>
          </li>

          {isStaff && (
            <li>
              <NavLink
                to="/admin"
                className="nav-admin-badge"
                style={{
                  background: "rgba(254, 161, 22, 0.15)",
                  color: "var(--restoran-primary)",
                  border: "1px solid var(--restoran-primary)",
                  fontWeight: "700",
                }}
              >
                Operations Hub
              </NavLink>
            </li>
          )}
        </ul>

        {/* Action Controls Group */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Cart Icon */}
          <NavLink
            to="/cart"
            className="btn-nav-cart"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
            onClick={() => setMobileOpen(false)}
          >
            <i className="fa fa-shopping-cart"></i>
            <span>Cart</span>
            {totalCount > 0 && <span className="cart-counter-pill">{totalCount}</span>}
          </NavLink>

          {/* Book A Table Button */}
          <Link to="/reservations" className="btn-book-nav">
            Book A Table
          </Link>

          {/* User Sign In / Log Out */}
          {user ? (
            <button
              className="btn-nav-logout"
              onClick={handleLogout}
              style={{ color: "#E2E8F0" }}
              title="Sign Out"
            >
              Log Out
            </button>
          ) : (
            <NavLink
              to="/login"
              className="btn-nav-login"
              style={{
                background: "transparent",
                color: "#FFFFFF",
                borderColor: "rgba(255, 255, 255, 0.2)",
              }}
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </NavLink>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-menu-toggle"
            style={{ color: "#FFFFFF", borderColor: "rgba(255, 255, 255, 0.2)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <i className={mobileOpen ? "fa fa-times" : "fa fa-bars"}></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`mobile-nav-drawer ${mobileOpen ? "open" : ""}`}
        style={{ background: "var(--restoran-dark)", borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        <ul className="mobile-nav-links">
          <li>
            <NavLink to="/" onClick={() => setMobileOpen(false)} style={{ color: "#fff" }}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/menu" onClick={() => setMobileOpen(false)} style={{ color: "#fff" }}>
              Handcrafted Menu
            </NavLink>
          </li>
          <li>
            <NavLink to="/reservations" onClick={() => setMobileOpen(false)} style={{ color: "#fff" }}>
              Reserve a Table
            </NavLink>
          </li>
          <li>
            <NavLink to="/cart" onClick={() => setMobileOpen(false)} style={{ color: "#fff" }}>
              Platter Cart ({totalCount} items)
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} style={{ color: "#fff" }}>
              Account & Loyalty Wallet
            </NavLink>
          </li>
          {isStaff && (
            <li>
              <NavLink to="/admin" onClick={() => setMobileOpen(false)} style={{ color: "var(--restoran-primary)" }}>
                Operations Hub
              </NavLink>
            </li>
          )}
          <li>
            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "18px",
                  fontWeight: "700",
                  padding: "10px 0",
                  cursor: "pointer",
                }}
              >
                Log Out ({user.name})
              </button>
            ) : (
              <NavLink to="/login" onClick={() => setMobileOpen(false)} style={{ color: "#fff" }}>
                Sign In / Register
              </NavLink>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
}
