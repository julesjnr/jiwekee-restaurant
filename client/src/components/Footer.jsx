import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ background: "var(--restoran-dark)", color: "#CBD5E1", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "70px 24px 24px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px", marginBottom: "50px" }}>
        
        {/* Column 1: Company */}
        <div>
          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "800", color: "var(--restoran-primary)", marginBottom: "20px" }}>
            Company
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            <li>
              <Link to="/#about" style={{ color: "#CBD5E1", fontSize: "14px", transition: "color 0.3s" }}>
                <i className="fa fa-chevron-right" style={{ color: "var(--restoran-primary)", fontSize: "11px", marginRight: "8px" }}></i>
                About Us
              </Link>
            </li>
            <li>
              <Link to="/menu" style={{ color: "#CBD5E1", fontSize: "14px", transition: "color 0.3s" }}>
                <i className="fa fa-chevron-right" style={{ color: "var(--restoran-primary)", fontSize: "11px", marginRight: "8px" }}></i>
                Food Menu
              </Link>
            </li>
            <li>
              <Link to="/reservations" style={{ color: "#CBD5E1", fontSize: "14px", transition: "color 0.3s" }}>
                <i className="fa fa-chevron-right" style={{ color: "var(--restoran-primary)", fontSize: "11px", marginRight: "8px" }}></i>
                Reservation
              </Link>
            </li>
            <li>
              <Link to="/dashboard" style={{ color: "#CBD5E1", fontSize: "14px", transition: "color 0.3s" }}>
                <i className="fa fa-chevron-right" style={{ color: "var(--restoran-primary)", fontSize: "11px", marginRight: "8px" }}></i>
                Loyalty Wallet
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Contact */}
        <div>
          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "800", color: "var(--restoran-primary)", marginBottom: "20px" }}>
            Contact
          </h4>
          <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.7", marginBottom: "10px" }}>
            <i className="fa fa-map-marker-alt" style={{ color: "var(--restoran-primary)", marginRight: "10px" }}></i>
            Ngong Road, Kilimani, Nairobi, Kenya
          </p>
          <p style={{ fontSize: "14px", color: "#CBD5E1", marginBottom: "10px" }}>
            <i className="fa fa-phone-alt" style={{ color: "var(--restoran-primary)", marginRight: "10px" }}></i>
            +254 700 000 000
          </p>
          <p style={{ fontSize: "14px", color: "#CBD5E1", marginBottom: "16px" }}>
            <i className="fa fa-envelope" style={{ color: "var(--restoran-primary)", marginRight: "10px" }}></i>
            info@jiwekeerestaurant.com
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <a href="#twitter" className="team-social-btn" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#facebook" className="team-social-btn" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#youtube" className="team-social-btn" aria-label="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="#instagram" className="team-social-btn" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>

        {/* Column 3: Opening Hours */}
        <div>
          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "800", color: "var(--restoran-primary)", marginBottom: "20px" }}>
            Opening Hours
          </h4>
          <h5 style={{ fontSize: "15px", color: "#FFFFFF", margin: "0 0 4px", fontWeight: "700" }}>Monday - Saturday</h5>
          <p style={{ fontSize: "13.5px", color: "#94A3B8", marginBottom: "14px" }}>09:00 AM - 11:00 PM</p>
          <h5 style={{ fontSize: "15px", color: "#FFFFFF", margin: "0 0 4px", fontWeight: "700" }}>Sunday</h5>
          <p style={{ fontSize: "13.5px", color: "#94A3B8", marginBottom: "14px" }}>10:00 AM - 10:00 PM</p>
        </div>

        {/* Column 4: Newsletter & Verified Portal */}
        <div>
          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "800", color: "var(--restoran-primary)", marginBottom: "20px" }}>
            Newsletter & Pay
          </h4>
          <p style={{ fontSize: "13.5px", color: "#CBD5E1", marginBottom: "14px", lineHeight: "1.6" }}>
            Subscribe for chef’s seasonal specials, weekend live grill events, and VIP loyalty rewards.
          </p>
          <div style={{ position: "relative", maxWidth: "400px", marginBottom: "16px" }}>
            <input
              type="email"
              placeholder="Your email address"
              style={{
                width: "100%",
                padding: "12px 100px 12px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              type="button"
              className="btn-book-nav"
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                padding: "8px 16px",
                fontSize: "12px",
                borderRadius: "6px",
              }}
            >
              Sign Up
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
              💳 Safaricom M-Pesa STK & Digital Wallet Verified
            </span>
            <Link
              to="/admin/login"
              style={{ fontSize: "12px", color: "var(--restoran-primary)", textDecoration: "underline" }}
            >
              Staff & Operations Login →
            </Link>
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "#94A3B8" }}>
        <div>
          © {new Date().getFullYear()}{" "}
          <strong style={{ color: "#fff" }}>Jiwekee Restaurant & Grill</strong>. All Rights Reserved. Designed with Restoran theme.
        </div>
        <div style={{ display: "flex", gap: "18px" }}>
          <Link to="/" style={{ color: "#94A3B8" }}>Home</Link>
          <Link to="/menu" style={{ color: "#94A3B8" }}>Menu</Link>
          <Link to="/reservations" style={{ color: "#94A3B8" }}>Booking</Link>
          <Link to="/dashboard" style={{ color: "#94A3B8" }}>Account</Link>
        </div>
      </div>
    </footer>
  );
}
