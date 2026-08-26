import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getSalesAnalytics()])
      .then(([statsData, analyticsData]) => {
        setStats(statsData);
        setAnalytics(analyticsData);
      })
      .catch((err) => console.error("Reports error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-notice">Generating restaurant performance reports...</div>;
  }

  const {
    totalSales = 0,
    totalOrdersCount = 0,
    averageOrderValue = 0,
    todaySales = 0,
    todayOrdersCount = 0,
    mpesaRevenue = 0,
    walletRevenue = 0,
    popularItems = [],
  } = stats || {};

  const { dailySales = [], paymentBreakdown = [] } = analytics || {};

  const maxDailySales = Math.max(...dailySales.map((d) => d.sales), 1000);

  return (
    <div>
      {/* Top Level KPIs */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Gross Lifetime Sales</div>
          <div className="metric-value metric-highlight">KES {Number(totalSales).toFixed(2)}</div>
          <div className="metric-subtitle">Across {totalOrdersCount} orders</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Average Order Value (AOV)</div>
          <div className="metric-value metric-info">KES {Number(averageOrderValue).toFixed(2)}</div>
          <div className="metric-subtitle">Per successful checkout</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Today's Sales Run Rate</div>
          <div className="metric-value metric-success">KES {Number(todaySales).toFixed(2)}</div>
          <div className="metric-subtitle">{todayOrdersCount} orders placed today</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">M-Pesa STK Collection</div>
          <div className="metric-value">KES {Number(mpesaRevenue).toFixed(2)}</div>
          <div className="metric-subtitle">Mobile money direct</div>
        </div>
      </div>

      {/* Visual Chart 1: 7-Day Sales Trend Bar Graph */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: "16px" }}>
          7-Day Revenue & Sales Trend
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            height: "200px",
            paddingTop: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            gap: "12px",
          }}
        >
          {dailySales.map((day, idx) => {
            const heightPercent = Math.max(8, (day.sales / maxDailySales) * 100);
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ fontSize: "11px", color: "#ffcc00", marginBottom: "6px", fontWeight: "700" }}>
                  {day.sales > 0 ? `KES ${Math.round(day.sales)}` : "—"}
                </div>
                <div
                  style={{
                    width: "100%",
                    maxWidth: "48px",
                    height: `${heightPercent}%`,
                    background: "linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)",
                    borderRadius: "6px 6px 0 0",
                    transition: "height 0.3s ease",
                  }}
                />
                <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px", fontWeight: "600" }}>
                  {day.dayName}
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>{day.orders} orders</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Payment Share + Top Sellers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Payment Channels Breakdown */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: "16px" }}>
            Revenue Breakdown by Channel
          </h3>
          {paymentBreakdown.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "16px",
                background: "#1a1a1a",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontWeight: "700", color: "#fff" }}>{item.method}</span>
                <span style={{ fontWeight: "800", color: "#ffcc00" }}>
                  KES {Number(item.revenue).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {item.count} settled transactions
              </div>
            </div>
          ))}
        </div>

        {/* Top 5 Revenue-Generating Dishes */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: "16px" }}>
            Top 5 Menu Performers
          </h3>
          {popularItems.length === 0 ? (
            <p style={{ color: "#888", fontSize: "13px" }}>No dish sales recorded yet.</p>
          ) : (
            popularItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <span style={{ fontWeight: "700", color: "#fff" }}>
                    #{idx + 1} {item.name}
                  </span>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    {item.quantity} orders fulfilled
                  </div>
                </div>
                <div style={{ fontWeight: "800", color: "#ffcc00", fontSize: "14px" }}>
                  KES {item.revenue.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
