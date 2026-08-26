import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const { cart, addItem, decrementItem, removeItem } = useCart();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orderType, setOrderType] = useState(() => localStorage.getItem("jiwekee_order_type") || "Dine-In");
  const [tableNumber, setTableNumber] = useState(() => localStorage.getItem("jiwekee_table_number") || "T-01");
  const [deliveryAddress, setDeliveryAddress] = useState(() => localStorage.getItem("jiwekee_delivery_address") || "");
  const [notes, setNotes] = useState(() => localStorage.getItem("jiwekee_order_notes") || "");
  const navigate = useNavigate();

  useEffect(() => {
    api.getMenu().then(({ items }) => setMenuItems(items || []));
    api.getTables().then(({ tables }) => setTables(tables || [])).catch(() => {});
  }, []);

  const handleDecrement = (itemId) => {
    if (decrementItem) {
      decrementItem(itemId);
    } else {
      const currentQty = cart[itemId] || 0;
      if (currentQty <= 1) {
        removeItem(itemId);
      } else {
        const updatedCart = { ...cart, [itemId]: currentQty - 1 };
        localStorage.setItem("jiwekee_cart", JSON.stringify(updatedCart));
        window.location.reload();
      }
    }
  };

  const cartRows = Object.entries(cart)
    .map(([itemId, quantity]) => {
      const item = menuItems.find((m) => String(m.id) === String(itemId));
      if (!item) return null;
      return { ...item, quantity, subtotal: Number(item.price) * quantity };
    })
    .filter(Boolean);

  const grandTotal = cartRows.reduce((sum, row) => sum + row.subtotal, 0);

  function goToCheckout() {
    if (!user) {
      navigate("/login");
      return;
    }
    // Save order details to localStorage for checkout
    localStorage.setItem("jiwekee_order_type", orderType);
    localStorage.setItem("jiwekee_table_number", tableNumber);
    localStorage.setItem("jiwekee_delivery_address", deliveryAddress);
    localStorage.setItem("jiwekee_order_notes", notes);
    navigate("/checkout");
  }

  return (
    <main className="checkout-wrapper">
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-main-heading">Your Dining Platter & Cart</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "15px", marginTop: "-16px" }}>
          Review your selected culinary creations and specify your dining preferences before proceeding to payment.
        </p>
      </div>

      <div className="checkout-layout-grid">
        <section className="items-invoice-list">
          {/* Order Details & Dining Options Card */}
          <div className="order-options-card">
            <h2 className="section-card-title">
              1. Select Dining & Delivery Preference
            </h2>

            <div className="order-type-tabs">
              <button
                type="button"
                className={`order-type-btn ${orderType === "Dine-In" ? "active" : ""}`}
                onClick={() => setOrderType("Dine-In")}
              >
                Dine-In
              </button>
              <button
                type="button"
                className={`order-type-btn ${orderType === "Takeaway" ? "active" : ""}`}
                onClick={() => setOrderType("Takeaway")}
              >
                Takeaway / Pickup
              </button>
              <button
                type="button"
                className={`order-type-btn ${orderType === "Delivery" ? "active" : ""}`}
                onClick={() => setOrderType("Delivery")}
              >
                Direct Delivery
              </button>
            </div>

            {orderType === "Dine-In" && (
              <div style={{ marginBottom: "16px" }}>
                <label className="form-label">
                  Restaurant Table Seating:
                </label>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="custom-select"
                >
                  {tables.length > 0 ? (
                    tables.map((t) => (
                      <option key={t.id} value={t.table_number}>
                        {t.table_number} ({t.section} • Capacity {t.capacity} Guests)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="T-01">Table T-01 (Main Dining Hall)</option>
                      <option value="T-02">Table T-02 (Terrace Garden)</option>
                      <option value="VIP-01">VIP Lounge 01</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {orderType === "Delivery" && (
              <div style={{ marginBottom: "16px" }}>
                <label className="form-label">
                  Delivery Destination & Apartment Details:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring Road Kilimani, Palm Heights Apt 4B"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="custom-input"
                />
              </div>
            )}

            <div>
              <label className="form-label">
                Chef Preparation Notes / Allergies:
              </label>
              <input
                type="text"
                placeholder="e.g. Medium-rare meat, extra kachumbari, chili on the side"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="custom-input"
              />
            </div>
          </div>

          {/* Cart Item Cards */}
          <h2 className="section-card-title" style={{ marginTop: "16px", marginBottom: "16px" }}>
            2. Selected Dishes ({cartRows.reduce((a, b) => a + b.quantity, 0)} items)
          </h2>

          {cartRows.length > 0 ? (
            cartRows.map((item) => (
              <div className="cart-invoice-item-card" key={item.id}>
                <div className="thumbnail-wrapper">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = "/images/choma.jpg";
                    }}
                  />
                </div>
                <div className="item-details-column">
                  <h3>{item.name}</h3>
                  <p className="unit-pricing">
                    KES {Number(item.price).toFixed(2)} each
                  </p>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleDecrement(item.id)}
                      title="Decrease quantity"
                    >
                      -
                    </button>
                    <span style={{ fontSize: "14px", fontWeight: "800", minWidth: "24px", textAlign: "center", color: "var(--color-primary)" }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => addItem(item.id)}
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="item-subtotal-actions-column">
                  <span className="calculated-row-subtotal">KES {item.subtotal.toFixed(2)}</span>
                  <button className="btn-remove-item" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-items-card">
              <h3 style={{ color: "var(--color-primary)", marginBottom: "8px" }}>Your Platter Cart is Empty</h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
                Add delicious artisanal dishes from our handcrafted menu to start your order.
              </p>
              <Link to="/menu" className="btn-hero-primary" style={{ display: "inline-flex" }}>
                Explore Menu →
              </Link>
            </div>
          )}
        </section>

        {/* Order Summary Right Column */}
        {cartRows.length > 0 && (
          <aside className="summary-invoice-panel-card">
            <h2 className="section-card-title">
              Order Summary
            </h2>
            <div className="summary-row-metric">
              <span>Dining Type</span>
              <span style={{ color: "var(--color-accent)", fontWeight: "700" }}>{orderType}</span>
            </div>
            {orderType === "Dine-In" && (
              <div className="summary-row-metric">
                <span>Selected Table</span>
                <span style={{ fontWeight: "600", color: "var(--color-primary)" }}>{tableNumber}</span>
              </div>
            )}
            <div className="summary-row-metric">
              <span>Items Total</span>
              <span>KES {grandTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row-metric">
              <span>Service & Packaging</span>
              <span style={{ color: "var(--color-success)", fontWeight: "700" }}>FREE</span>
            </div>
            <div className="summary-row-metric" style={{ fontSize: "12.5px", color: "var(--color-text-light)" }}>
              <span>Loyalty Points to Earn</span>
              <span style={{ color: "var(--color-accent)", fontWeight: "700" }}>+{Math.floor(grandTotal / 10)} pts</span>
            </div>
            
            <hr className="summary-divider-line" />
            
            <div className="summary-row-metric total-payment-row">
              <span>Total Payable</span>
              <span className="final-grand-total-text">KES {grandTotal.toFixed(2)}</span>
            </div>

            <button className="btn-checkout-finalize" onClick={goToCheckout}>
              <span>Proceed to Checkout</span>
              <span>→</span>
            </button>

            <p style={{ fontSize: "12px", color: "var(--color-text-light)", textAlign: "center", marginTop: "14px" }}>
              Instant M-Pesa STK push and digital wallet supported.
            </p>
          </aside>
        )}
      </div>
    </main>
  );
}
