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
          <div className="metric-header">
            <div>
              <div className="metric-title">Lifetime Gross Revenue</div>
              <div className="metric-value metric-highlight">KES {Number(totalSales).toFixed(2)}</div>
            </div>
            <div className="metric-icon-wrap">
              <i className="fa fa-dollar-sign"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-receipt" style={{ color: "var(--primary)" }}></i> Across {totalOrdersCount} fulfilled orders
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Average Order Value</div>
              <div className="metric-value metric-info">KES {Number(averageOrderValue).toFixed(2)}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(2, 132, 199, 0.12)", color: "var(--color-info)" }}>
              <i className="fa fa-calculator"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-chart-line" style={{ color: "var(--color-info)" }}></i> Per successful diner checkout
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Today's Sales Run Rate</div>
              <div className="metric-value metric-success">KES {Number(todaySales).toFixed(2)}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(46, 125, 50, 0.12)", color: "var(--color-success)" }}>
              <i className="fa fa-shopping-bag"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-clock" style={{ color: "var(--color-success)" }}></i> {todayOrdersCount} orders placed today
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">M-Pesa STK Gross</div>
              <div className="metric-value" style={{ color: "var(--color-success)" }}>KES {Number(mpesaRevenue).toFixed(2)}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(46, 125, 50, 0.12)", color: "var(--color-success)" }}>
              <i className="fa fa-mobile-alt"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-shield-alt" style={{ color: "var(--color-success)" }}></i> Mobile money direct settlement
          </div>
        </div>
      </div>

      {/* Visual Chart 1: 7-Day Sales Trend Bar Graph */}
      <div className="admin-card" style={{ marginBottom: "24px" }}>
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">
              <i className="fa fa-chart-bar" style={{ color: "var(--primary)" }}></i>
              7-Day Revenue & Sales Velocity
            </h3>
            <p className="admin-card-desc">Daily revenue run-rates and total ticket volume over the last week.</p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            height: "220px",
            paddingTop: "24px",
            borderBottom: "2px solid var(--light-gray)",
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
                <div style={{ fontSize: "11px", color: "var(--primary-dark)", marginBottom: "6px", fontWeight: "800", fontFamily: "Nunito, sans-serif" }}>
                  {day.sales > 0 ? `KES ${Math.round(day.sales)}` : "—"}
                </div>
                <div
                  style={{
                    width: "100%",
                    maxWidth: "52px",
                    height: `${heightPercent}%`,
                    background: "linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%)",
                    borderRadius: "6px 6px 0 0",
                    transition: "height 0.3s ease",
                    boxShadow: "0 2px 8px rgba(212, 167, 74, 0.2)",
                  }}
                />
                <div style={{ fontSize: "12.5px", color: "var(--secondary)", marginTop: "8px", fontWeight: "700" }}>
                  {day.dayName}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--gray)" }}>{day.orders} orders</div>
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
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <i className="fa fa-credit-card" style={{ color: "var(--primary)" }}></i>
              Revenue by Channel
            </h3>
          </div>
          {paymentBreakdown.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "12px",
                background: "var(--light-bg)",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid var(--light-gray)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontWeight: "800", color: "var(--secondary)", textTransform: "capitalize", fontSize: "14px" }}>
                  <i className={item.method.toLowerCase().includes("mpesa") ? "fa fa-mobile-alt" : "fa fa-wallet"} style={{ color: "var(--primary)", marginRight: "8px" }}></i>
                  {item.method}
                </span>
                <span style={{ fontWeight: "900", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif", fontSize: "15px" }}>
                  KES {Number(item.revenue).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--gray)" }}>
                {item.count} verified transactions
              </div>
            </div>
          ))}
        </div>

        {/* Top 5 Revenue-Generating Dishes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <i className="fa fa-crown" style={{ color: "var(--primary)" }}></i>
              Top 5 Revenue Dishes
            </h3>
          </div>
          {popularItems.length === 0 ? (
            <p style={{ color: "var(--gray)", fontSize: "13px", textAlign: "center", padding: "20px" }}>No dish sales recorded yet.</p>
          ) : (
            popularItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--light-gray)",
                }}
              >
                <div>
                  <span style={{ fontWeight: "800", color: "var(--secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: idx === 0 ? "var(--primary)" : "var(--light-gray)",
                        color: idx === 0 ? "#fff" : "var(--secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                    >
                      {idx + 1}
                    </span>
                    {item.name}
                  </span>
                  <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "2px", marginLeft: "30px" }}>
                    {item.quantity} orders fulfilled
                  </div>
                </div>
                <div style={{ fontWeight: "900", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif", fontSize: "15px" }}>
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
