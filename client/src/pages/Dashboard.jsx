import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import OrderFrequencyChart from "../components/OrderFrequencyChart";

const FULFILLMENT_STEPS = ["Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Completed"];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Points redemption state
  const [redeemPoints, setRedeemPoints] = useState(50);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeemError, setRedeemError] = useState("");

  // Top Up Wallet state
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [topUpPhone, setTopUpPhone] = useState(user?.phone || "");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState("");
  const [topUpError, setTopUpError] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getOrders(),
      api.getMyReservations(),
      api.getWalletBalance().catch(() => null),
      api.getWalletTransactions().catch(() => ({ transactions: [] })),
    ])
      .then(([ordersData, resData, walletRes, txRes]) => {
        setOrders(ordersData.orders || []);
        setReservations(resData.reservations || []);
        if (walletRes) setWalletData(walletRes);
        if (txRes?.transactions) setWalletTransactions(txRes.transactions);
      })
      .catch((err) => console.error("Dashboard error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (e) => {
    e.preventDefault();
    setRedeemMsg("");
    setRedeemError("");
    try {
      const data = await api.redeemPoints(Number(redeemPoints));
      setRedeemMsg(data.message);
      if (refreshUser) await refreshUser();
      fetchData();
      setTimeout(() => {
        setIsRedeemOpen(false);
        setRedeemMsg("");
      }, 2000);
    } catch (err) {
      setRedeemError(err.message || "Failed to redeem points.");
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setTopUpMsg("");
    setTopUpError("");
    setTopUpLoading(true);

    try {
      const res = await api.topUpWallet({
        amount: Number(topUpAmount),
        paymentMethod: "mpesa",
        phone: topUpPhone,
      });

      setTopUpMsg(res.message);
      if (refreshUser) await refreshUser();
      fetchData();

      setTimeout(() => {
        setIsTopUpOpen(false);
        setTopUpMsg("");
      }, 2000);
    } catch (err) {
      setTopUpError(err.message || "Failed to top up wallet.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const activeOrder = orders.find(
    (o) => o.fulfillment_status !== "Completed" && o.fulfillment_status !== "Cancelled"
  );

  const getStepIndex = (status) => {
    const idx = FULFILLMENT_STEPS.indexOf(status);
    return idx === -1 ? 1 : idx;
  };

  const activeStepIdx = activeOrder ? getStepIndex(activeOrder.fulfillment_status) : 0;

  const currentWalletBalance = Number(
    walletData?.balance !== undefined ? walletData.balance : user?.wallet_balance || 0
  );

  let loyaltyTier = walletData?.loyalty_tier || "Bronze";
  const userPoints = Number(
    walletData?.loyalty_points !== undefined ? walletData.loyalty_points : user?.loyalty_points || 0
  );
  if (userPoints >= 500) loyaltyTier = "Platinum";
  else if (userPoints >= 250) loyaltyTier = "Gold";
  else if (userPoints >= 100) loyaltyTier = "Silver";

  return (
    <main className="dashboard-page">
      <div className="dashboard-content">
        {/* Welcome Top Banner */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--color-primary)", margin: 0 }}>
              Welcome back, {user?.name || "Foodie"}!
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginTop: "4px" }}>
              Jiwekee Club Member • {user?.email}
            </p>
          </div>
          <button onClick={fetchData} className="btn-action-sm btn-action-dark" style={{ padding: "9px 18px" }}>
            ↻ Refresh Balance & Status
          </button>
        </div>

        {/* Top Cards: Live Database Wallet Balance & Loyalty Tier */}
        <div className="dashboard-grid-top">
          {/* Digital Wallet Card */}
          <div className="wallet-card">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Digital Loyalty Wallet</h2>
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(255,255,255,0.15)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: "600",
                  }}
                >
                  PostgreSQL Real-Time
                </span>
              </div>
              <p className="wallet-amount">
                KES {currentWalletBalance.toFixed(2)}
              </p>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "8px" }}>
                Directly synchronized with your PostgreSQL ledger. Ready for contactless platter checkout.
              </p>

              {walletData?.last_transaction && (
                <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  Last Activity: {new Date(walletData.last_transaction).toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setTopUpPhone(user?.phone || "");
                  setIsTopUpOpen(true);
                }}
                className="btn-action-sm btn-action-primary"
                style={{ flex: 1, textAlign: "center" }}
              >
                + Top Up Wallet
              </button>
              <Link
                to="/menu"
                className="btn-action-sm btn-action-dark"
                style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
              >
                Order from Menu →
              </Link>
            </div>
          </div>

          {/* Loyalty Program Card */}
          <div className="loyalty-card">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>
                  Jiwekee Rewards
                </span>
                <span className="loyalty-tier-badge">{loyaltyTier} Tier</span>
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#FFFFFF", margin: "12px 0 6px" }}>
                {userPoints} Points
              </div>
              <p style={{ fontSize: "12.5px", color: "#D6CBC0", lineHeight: "1.5" }}>
                Earn 1 point for every KES 10 spent. Convert 50 points into KES 50.00 wallet credit anytime.
              </p>
            </div>

            <button
              onClick={() => setIsRedeemOpen(true)}
              className="btn-action-sm btn-action-primary"
              style={{ marginTop: "18px", padding: "11px", width: "100%", fontSize: "13.5px" }}
            >
              Redeem Points for Wallet Cash
            </button>
          </div>
        </div>

        {/* Live Wallet Transaction History Ledger */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "32px",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--color-primary)", margin: 0 }}>
                Digital Wallet Ledger & Transaction Log
              </h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: "4px 0 0" }}>
                Live record of every credit, top-up, points reward, and platter payment.
              </p>
            </div>
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="btn-action-sm btn-action-primary"
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              + Quick Top Up
            </button>
          </div>

          {walletTransactions.length === 0 ? (
            <div className="no-items-card" style={{ padding: "20px" }}>
              No wallet transactions recorded yet. Top up or earn loyalty cash on your next platter order!
            </div>
          ) : (
            <div className="data-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {walletTransactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    return (
                      <tr key={tx.id}>
                        <td>
                          <code style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                            {tx.reference_id || `#${tx.id}`}
                          </code>
                        </td>
                        <td>
                          <span
                            style={{
                              background: isCredit ? "rgba(56, 176, 0, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: isCredit ? "#38b000" : "#ef4444",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                            }}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td style={{ color: "var(--color-primary)", fontWeight: "500", fontSize: "13px" }}>
                          {tx.description}
                        </td>
                        <td
                          style={{
                            fontWeight: "800",
                            color: isCredit ? "#38b000" : "#ef4444",
                            fontSize: "13.5px",
                          }}
                        >
                          {isCredit ? `+KES ${Number(tx.amount).toFixed(2)}` : `-KES ${Math.abs(Number(tx.amount)).toFixed(2)}`}
                        </td>
                        <td style={{ fontWeight: "700", color: "var(--color-primary)", fontSize: "13px" }}>
                          KES {Number(tx.balance_after).toFixed(2)}
                        </td>
                        <td style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                          {new Date(tx.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Live Order Tracker */}
        {activeOrder && (
          <div className="tracker-box">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--color-primary)" }}>
                  Live Order #{activeOrder.id} Tracker
                </span>
                <span style={{ color: "var(--color-accent)", fontSize: "13.5px", marginLeft: "12px", fontWeight: "700" }}>
                  {activeOrder.table_number ? `Table ${activeOrder.table_number}` : activeOrder.order_type}
                </span>
              </div>
              <span
                className={`status-badge status-${(activeOrder.fulfillment_status || "confirmed").toLowerCase().replace(/\s+/g, "-")}`}
              >
                {activeOrder.fulfillment_status || "Confirmed"}
              </span>
            </div>

            {/* Step Progression Bar */}
            <div className="tracker-steps">
              {["Confirmed", "Preparing", "Ready", "Completed"].map((step, idx) => {
                const isCompleted = activeStepIdx >= idx + 1;
                const isActive =
                  activeOrder.fulfillment_status === step ||
                  (step === "Confirmed" && activeOrder.fulfillment_status === "Pending");

                return (
                  <div
                    key={step}
                    className={`tracker-step ${isCompleted ? "completed" : isActive ? "active" : ""}`}
                  >
                    <div className="step-circle">{isCompleted ? "✓" : idx + 1}</div>
                    <div className="step-label">{step}</div>
                  </div>
                );
              })}
            </div>

            {activeOrder.notes && (
              <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", marginTop: "14px", background: "var(--color-surface-soft)", padding: "8px 12px", borderRadius: "6px" }}>
                Chef note: "{activeOrder.notes}"
              </div>
            )}
          </div>
        )}

        {/* Upcoming Table Reservations Section */}
        {reservations.length > 0 && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              marginBottom: "32px",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "17px", fontWeight: "700", color: "var(--color-primary)", margin: 0 }}>
                My Table Bookings
              </h2>
              <Link to="/reservations" className="btn-action-sm btn-action-primary">
                + Book Another Table
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
              {reservations.map((res) => (
                <div
                  key={res.id}
                  style={{
                    background: "var(--color-surface-soft)",
                    padding: "14px 18px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "700", color: "var(--color-primary)", fontSize: "14px" }}>
                      Reservation #{res.id} ({res.guest_count} Guests)
                    </span>
                    <span className={`status-badge status-${res.status.toLowerCase()}`}>
                      {res.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-accent)", fontWeight: "600" }}>
                    {res.reservation_date} at {res.reservation_time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 30-Day Dining Engagement & Order Frequency Visual Analytics */}
        <OrderFrequencyChart orders={orders} />

        {/* Complete Order & Payment History */}
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--color-primary)", marginBottom: "16px" }}>
          Order & Payment History
        </h2>
        {loading ? (
          <p className="loading-notice">Loading your order history...</p>
        ) : orders.length === 0 ? (
          <div className="no-items-card">
            No dining orders yet — <Link to="/menu" style={{ color: "var(--color-accent)", fontWeight: "700" }}>explore our menu</Link> to build your first platter.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Amount</th>
                  <th>Order Type</th>
                  <th>Payment Status</th>
                  <th>Kitchen Fulfillment</th>
                  <th>Method</th>
                  <th>Receipt Ref</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: "700", color: "var(--color-accent)" }}>#{order.id}</td>
                    <td style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                      KES {Number(order.amount).toFixed(2)}
                    </td>
                    <td>{order.table_number ? `Table ${order.table_number}` : order.order_type}</td>
                    <td>
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${(order.fulfillment_status || "confirmed").toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {order.fulfillment_status || "Confirmed"}
                      </span>
                    </td>
                    <td style={{ textTransform: "uppercase", fontSize: "12px", fontWeight: "600" }}>
                      {order.payment_method}
                    </td>
                    <td>
                      <code style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                        {order.mpesa_receipt || "—"}
                      </code>
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Up Digital Wallet Modal */}
      {isTopUpOpen && (
        <div className="modal-backdrop" onClick={() => setIsTopUpOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Top Up Digital Wallet</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "13.5px", marginBottom: "18px" }}>
              Add credits directly to your PostgreSQL digital wallet balance for instant checkout.
            </p>

            {topUpMsg && <div className="form-success">{topUpMsg}</div>}
            {topUpError && <div className="form-error">{topUpError}</div>}

            <form onSubmit={handleTopUp}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                  Select Top-up Preset
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[250, 500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      style={{
                        background: topUpAmount === amt ? "var(--color-primary)" : "var(--color-surface-soft)",
                        color: topUpAmount === amt ? "#fff" : "var(--color-primary)",
                        border: "1px solid var(--color-border)",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      KES {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-input-group">
                <label>Amount (KES) *</label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                />
              </div>

              <div className="form-input-group">
                <label>M-Pesa Phone Number</label>
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={topUpPhone}
                  onChange={(e) => setTopUpPhone(e.target.value.replace(/[^0-9]/g, ""))}
                />
                <div className="phone-hint">
                  Simulates STK push and deposits real balance directly into PostgreSQL.
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(false)}
                  className="btn-action-sm btn-action-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topUpLoading || topUpAmount <= 0}
                  className="btn-action-sm btn-action-primary"
                >
                  {topUpLoading ? "Processing Deposit..." : `Deposit KES ${Number(topUpAmount || 0).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Loyalty Points Modal */}
      {isRedeemOpen && (
        <div className="modal-backdrop" onClick={() => setIsRedeemOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Redeem Loyalty Points</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "13.5px", marginBottom: "18px" }}>
              You currently have <strong style={{ color: "var(--color-primary)" }}>{userPoints} points</strong>. Convert your points directly to instant wallet balance credits.
            </p>

            {redeemMsg && <div className="form-success">{redeemMsg}</div>}
            {redeemError && <div className="form-error">{redeemError}</div>}

            <form onSubmit={handleRedeem}>
              <div className="form-input-group">
                <label>Points to Redeem (Min 50 pts) *</label>
                <input
                  type="number"
                  min="50"
                  max={userPoints}
                  step="10"
                  required
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Number(e.target.value))}
                />
              </div>

              <div
                style={{
                  background: "var(--color-accent-soft)",
                  border: "1px solid rgba(201, 107, 50, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px",
                  fontSize: "13.5px",
                  color: "var(--color-accent)",
                  marginBottom: "20px",
                  fontWeight: "600",
                }}
              >
                You will receive: <strong>KES {(redeemPoints * 1.0).toFixed(2)}</strong> added directly to your digital loyalty wallet!
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsRedeemOpen(false)}
                  className="btn-action-sm btn-action-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userPoints < 50}
                  className="btn-action-sm btn-action-primary"
                >
                  Convert & Add to Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
