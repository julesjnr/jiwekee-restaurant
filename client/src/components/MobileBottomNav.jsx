import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { totalCount } = useCart();
  const pathname = location.pathname;

  const isStaff = Boolean(user && (user.is_admin || (user.role && user.role !== "customer")));

  const navItems = [
    {
      id: "home",
      label: "Home",
      to: "/",
      icon: "fa-home",
      isActive: pathname === "/",
      ariaLabel: "Navigate to Home page",
    },
    {
      id: "menu",
      label: "Menu",
      to: "/menu",
      icon: "fa-utensils",
      isActive: pathname.startsWith("/menu"),
      ariaLabel: "Browse Dining Menu",
    },
    {
      id: "reservations",
      label: "Reserve",
      to: "/reservations",
      icon: "fa-calendar-alt",
      isActive: pathname.startsWith("/reservations"),
      ariaLabel: "Book a Table Reservation",
    },
    {
      id: "cart",
      label: "Cart",
      to: "/cart",
      icon: "fa-shopping-cart",
      badge: totalCount > 0 ? (totalCount > 99 ? "99+" : totalCount) : null,
      isActive: pathname.startsWith("/cart") || pathname.startsWith("/checkout"),
      ariaLabel: `Shopping Cart with ${totalCount} items`,
    },
    {
      id: "account",
      label: user ? (isStaff ? "Hub" : "Account") : "Sign In",
      to: user ? (isStaff ? "/admin" : "/dashboard") : "/login",
      icon: isStaff ? "fa-shield-alt" : "fa-user",
      isActive:
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password"),
      ariaLabel: user ? "View Account and Wallet" : "Sign In or Register",
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              to={item.to}
              className={`mobile-bottom-nav-item ${active ? "active" : ""}`}
              aria-label={item.ariaLabel}
              aria-current={active ? "page" : undefined}
            >
              <div className="mobile-nav-icon-container">
                <i className={`fa ${item.icon} mobile-nav-icon`} aria-hidden="true"></i>
                {item.badge && (
                  <span className="mobile-nav-badge" aria-label={`${item.badge} items in cart`}>
                    {item.badge}
                  </span>
                )}
                {active && <span className="mobile-nav-active-pill" aria-hidden="true"></span>}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
