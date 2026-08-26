import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [phone, setPhone] = useState(user?.phone || "");
  const [status, setStatus] = useState({ loading: false, error: "", message: "" });
  const navigate = useNavigate();

  const orderType = localStorage.getItem("jiwekee_order_type") || "Dine-In";
  const tableNumber = localStorage.getItem("jiwekee_table_number") || "";
  const deliveryAddress = localStorage.getItem("jiwekee_delivery_address") || "";
  const notes = localStorage.getItem("jiwekee_order_notes") || "";

  useEffect(() => {
    api.getMenu().then(({ items }) => setMenuItems(items || []));
  }, []);

  const items = Object.entries(cart)
    .map(([id, quantity]) => {
      const item = menuItems.find((m) => String(m.id) === String(id));
      return item ? { id: item.id, quantity, price: Number(item.price) } : null;
    })
    .filter(Boolean);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const pointsToEarn = Math.floor(total / 10);
  const walletBalance = Number(user?.wallet_balance || 0);
  const canPayWithWallet = walletBalance >= total && total > 0;

  async function pay(paymentMethod) {
    if (total <= 0) {
      setStatus({
        loading: false,
        error: "Your cart is empty. Add something from the menu first.",
        message: "",
      });
      return;
    }
    if (paymentMethod === "mpesa" && !phone) {
      setStatus({ loading: false, error: "Enter your M-Pesa mobile phone number.", message: "" });
      return;
    }

    setStatus({ loading: true, error: "", message: "" });
    try {
      const payload = {
        items: items.map(({ id, quantity }) => ({ id, quantity })),
        paymentMethod,
        orderType,
        tableNumber: orderType === "Dine-In" ? tableNumber : null,
        deliveryAddress: orderType === "Delivery" ? deliveryAddress : null,
        notes,
      };
      if (paymentMethod === "mpesa") payload.phone = phone;

      const result = await api.checkout(payload);
      clearCart();
      if (refreshUser) refreshUser();

      setStatus({
        loading: false,
        error: "",
        message: result.message || "Order successfully placed and sent to kitchen!",
      });
      setTimeout(() => navigate("/dashboard"), 1600);
    } catch (err) {
      setStatus({ loading: false, error: err.message, message: "" });
    }
  }

  return (
    <main className="checkout-wrapper">
      <div className="checkout-box">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--color-primary)", marginBottom: "6px" }}>
          Complete Your Dining Order
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "20px" }}>
          Select your preferred payment method to dispatch your order immediately to our kitchen brigade.
        </p>

        <div style={{ background: "var(--color-surface-soft)", padding: "14px 18px", borderRadius: "var(--radius-md)", marginBottom: "20px", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "var(--color-text-muted)", fontSize: "13.5px" }}>Order Type:</span>
            <strong style={{ color: "var(--color-accent)", fontSize: "14px" }}>{orderType}</strong>
          </div>
          {orderType === "Dine-In" && tableNumber && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13.5px" }}>Seating Table:</span>
              <strong style={{ color: "var(--color-primary)", fontSize: "14px" }}>{tableNumber}</strong>
            </div>
          )}
          {orderType === "Delivery" && deliveryAddress && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13.5px" }}>Address:</span>
              <strong style={{ color: "var(--color-primary)", fontSize: "13.5px" }}>{deliveryAddress}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--color-primary)" }}>Total Payable:</span>
            <strong style={{ color: "var(--color-accent)", fontSize: "18px" }}>KES {total.toFixed(2)}</strong>
          </div>
        </div>

        {pointsToEarn > 0 && (
          <div
            style={{
              background: "var(--color-accent-soft)",
              border: "1px solid rgba(201, 107, 50, 0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              color: "var(--color-accent)",
              fontSize: "13px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
            }}
          >
            You will earn <strong>+{pointsToEarn} Loyalty Points</strong> upon checkout!
          </div>
        )}

        <div className="wallet-balance-highlight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Your Digital Wallet Balance:</span>
          <strong style={{ fontSize: "16px", color: "var(--color-primary)" }}>KES {walletBalance.toFixed(2)}</strong>
        </div>

        {status.error && <div className="form-error">{status.error}</div>}
        {status.message && <div className="form-success">{status.message}</div>}

        {total <= 0 ? (
          <div className="form-warning">
            Your active platter cart is empty. <Link to="/menu" style={{ color: "var(--color-accent)", fontWeight: "700" }}>Back to menu</Link>
          </div>
        ) : (
          <>
            {canPayWithWallet ? (
              <button
                className="mpesa-btn wallet-btn"
                disabled={status.loading}
                onClick={() => pay("wallet")}
              >
                Pay Instantly via Digital Wallet (KES {walletBalance.toFixed(2)})
              </button>
            ) : (
              <div className="form-warning" style={{ fontSize: "13px" }}>
                Wallet balance is KES {walletBalance.toFixed(2)}. Use Safaricom M-Pesa below to complete your payment.
              </div>
            )}

            <div className="or-divider">— OR PAY VIA SAFARICOM M-PESA STK PUSH —</div>

            <div className="form-input-group">
              <label htmlFor="phone_number">M-Pesa Mobile Number *</label>
              <input
                id="phone_number"
                type="tel"
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                required
              />
              <div className="phone-hint">
                You will receive a real-time STK PIN prompt directly on this mobile device.
              </div>
            </div>

            <button
              className="mpesa-btn"
              disabled={status.loading}
              onClick={() => pay("mpesa")}
            >
              {status.loading ? "Sending STK PIN Prompt..." : `Pay KES ${total.toFixed(2)} with M-Pesa`}
            </button>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link to="/cart" style={{ color: "var(--color-text-muted)", fontSize: "13.5px", fontWeight: "600" }}>
            ← Review Platter Selection
          </Link>
        </div>
      </div>
    </main>
  );
}
