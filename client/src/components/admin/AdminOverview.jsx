import { useState, useEffect } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function AdminOverview({ onNavigateTab }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sales Chart state
  const [chartPeriod, setChartPeriod] = useState("7d");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [activeBarHover, setActiveBarHover] = useState(null);

  const userRole = (user?.role || (user?.is_admin ? "owner" : "customer")).toLowerCase();

  // Load Main Dashboard Stats
  const loadDashboardData = () => {
    setLoading(true);
    setError(null);
    api
      .getDashboardStats()
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error("Dashboard stats load failed:", err);
        setError("Unable to connect to live operational data. Please refresh.");
      })
      .finally(() => setLoading(false));
  };

  // Load Sales Performance Chart Data
  const loadChartData = (period) => {
    setChartLoading(true);
    api
      .getSalesAnalytics({ period })
      .then((data) => {
        setChartData(data.salesSeries || data.dailySales || []);
      })
      .catch((err) => {
        console.error("Sales chart error:", err);
        setChartData([]);
      })
      .finally(() => setChartLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadChartData(chartPeriod);
  }, [chartPeriod]);

  if (loading) {
    return (
      <div className="overview-loading-container">
        <div className="admin-skeleton-grid">
          <div className="admin-skeleton-card" style={{ height: "130px" }}></div>
          <div className="admin-skeleton-card" style={{ height: "130px" }}></div>
          <div className="admin-skeleton-card" style={{ height: "130px" }}></div>
          <div className="admin-skeleton-card" style={{ height: "130px" }}></div>
        </div>
        <div className="admin-skeleton-card" style={{ height: "200px", marginTop: "24px" }}></div>
        <div className="admin-skeleton-card" style={{ height: "300px", marginTop: "24px" }}></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-card" style={{ textAlign: "center", padding: "48px 24px" }}>
        <i className="fa fa-exclamation-circle" style={{ fontSize: "36px", color: "var(--color-danger)", marginBottom: "16px" }}></i>
        <h3 style={{ color: "var(--secondary)", marginBottom: "8px" }}>Operational Data Unavailable</h3>
        <p style={{ color: "var(--gray)", maxWidth: "480px", margin: "0 auto 20px" }}>{error || "An unexpected error occurred while fetching dashboard statistics."}</p>
        <button onClick={loadDashboardData} className="btn-restoran-primary">
          <i className="fa fa-sync"></i> Retry Connection
        </button>
      </div>
    );
  }

  const {
    todaySales = 0,
    todayOrdersCount = 0,
    totalSales = 0,
    totalOrdersCount = 0,
    averageOrderValue = 0,
    mpesaRevenue = 0,
    walletRevenue = 0,
    totalCustomers = 0,
    statusCounts = {},
    lowStockAlerts = [],
    popularItems = [],
    recentOrders = [],
    todayReservations = [],
    todayReservationsCount = 0,
    pendingReservationsCount = 0,
    tablesCount = {},
    needsAttention = [],
    paymentReconciliation = {},
  } = stats;

  // Chart max computation
  const maxSalesInChart = Math.max(...chartData.map((d) => Number(d.sales) || 0), 1000);
  const totalChartSales = chartData.reduce((sum, d) => sum + (Number(d.sales) || 0), 0);
  const totalChartOrders = chartData.reduce((sum, d) => sum + (Number(d.orders) || 0), 0);

  return (
    <div className="overview-container">
      {/* 1. EXECUTIVE METRICS ROW */}
      <div className="metrics-grid">
        {/* Today's Revenue */}
        <div className="metric-card metric-card-primary">
          <div className="metric-header">
            <div>
              <div className="metric-title">Today's Revenue</div>
              <div className="metric-value metric-highlight">
                KES {Number(todaySales).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(212, 167, 74, 0.15)", color: "var(--primary-dark)" }}>
              <i className="fa fa-coins"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-chart-line" style={{ color: "var(--primary)" }}></i> Lifetime Gross: KES {Number(totalSales).toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
        </div>

        {/* Today's Orders */}
        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Today's Orders</div>
              <div className="metric-value">{todayOrdersCount}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(2, 132, 199, 0.12)", color: "var(--color-info)" }}>
              <i className="fa fa-shopping-bag"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-receipt"></i> {totalOrdersCount} lifetime orders ({statusCounts.completed || 0} completed)
          </div>
        </div>

        {/* Average Order Value */}
        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Average Order Value</div>
              <div className="metric-value" style={{ color: "var(--secondary)" }}>
                KES {Number(averageOrderValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(147, 51, 234, 0.12)", color: "#9333ea" }}>
              <i className="fa fa-calculator"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-tag" style={{ color: "#9333ea" }}></i> Per paid customer ticket
          </div>
        </div>

        {/* M-Pesa Collections */}
        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">M-Pesa Collections</div>
              <div className="metric-value metric-success">
                KES {Number(mpesaRevenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(46, 125, 50, 0.12)", color: "var(--color-success)" }}>
              <i className="fa fa-mobile-alt"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-shield-alt" style={{ color: "var(--color-success)" }}></i> Safaricom Daraja STK direct
          </div>
        </div>

        {/* Wallet & Diners */}
        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Wallet & Diners</div>
              <div className="metric-value" style={{ color: "var(--color-warning)" }}>
                KES {Number(walletRevenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(217, 119, 6, 0.12)", color: "var(--color-warning)" }}>
              <i className="fa fa-wallet"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-users" style={{ color: "var(--color-warning)" }}></i> {totalCustomers} registered diners
          </div>
        </div>
      </div>

      {/* 2. PROMINENT "NEEDS ATTENTION" TRIAGE SECTION */}
      <div className="admin-attention-card">
        <div className="admin-attention-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div className="attention-alert-badge">
              <i className="fa fa-bell"></i>
              <span>Needs Attention</span>
            </div>
            <span style={{ fontSize: "14px", color: "var(--gray)", fontWeight: "600" }}>
              {needsAttention.length} item{needsAttention.length === 1 ? "" : "s"} require immediate operational action
            </span>
          </div>

          <button
            onClick={loadDashboardData}
            className="btn-restoran-secondary"
            style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(0, 0, 0, 0.04)" }}
            title="Refresh operational queue"
          >
            <i className="fa fa-sync-alt"></i> Refresh
          </button>
        </div>

        {needsAttention.length === 0 ? (
          <div className="attention-empty-state">
            <i className="fa fa-check-circle" style={{ fontSize: "28px", color: "var(--color-success)", marginBottom: "8px", display: "block" }}></i>
            <h4 style={{ margin: "0 0 4px", color: "var(--secondary)", fontWeight: "800" }}>All Systems Operational</h4>
            <p style={{ margin: 0, color: "var(--gray)", fontSize: "13px" }}>No pending orders, unconfirmed bookings, low stock, or failed transactions at this time.</p>
          </div>
        ) : (
          <div className="attention-items-grid">
            {needsAttention.map((item) => (
              <div key={item.id} className={`attention-item-card urgency-${item.urgency || "medium"}`}>
                <div className="attention-item-left">
                  <div className={`attention-item-icon category-${item.category}`}>
                    {item.category === "order" && <i className="fa fa-shopping-bag"></i>}
                    {item.category === "reservation" && <i className="fa fa-calendar-check"></i>}
                    {item.category === "inventory" && <i className="fa fa-boxes"></i>}
                    {item.category === "payment" && <i className="fa fa-exclamation-triangle"></i>}
                  </div>
                  <div>
                    <div className="attention-item-title">{item.title}</div>
                    <div className="attention-item-subtitle">{item.subtitle}</div>
                    {item.waitMinutes !== undefined && (
                      <span className="attention-wait-tag">
                        <i className="fa fa-clock"></i> Waiting {item.waitMinutes}m
                      </span>
                    )}
                    {item.amount !== undefined && (
                      <span className="attention-amount-tag">
                        KES {Number(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab(item.targetTab || "orders")}
                  className="btn-restoran-primary attention-action-btn"
                >
                  {item.actionLabel || "Resolve"} <i className="fa fa-arrow-right" style={{ marginLeft: "4px" }}></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. SALES PERFORMANCE CHART (TODAY / 7 DAYS / 30 DAYS) */}
      <div className="admin-card" style={{ marginBottom: "28px" }}>
        <div className="admin-card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="admin-card-title">
              <i className="fa fa-chart-area" style={{ color: "var(--primary)" }}></i>
              Sales Velocity & Order Volume
            </h3>
            <p className="admin-card-desc">
              Real-time revenue run-rates and order flow directly from PostgreSQL transactions.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div className="sales-period-switcher">
              <button
                className={`period-btn ${chartPeriod === "today" ? "active" : ""}`}
                onClick={() => setChartPeriod("today")}
              >
                Today (Hourly)
              </button>
              <button
                className={`period-btn ${chartPeriod === "7d" ? "active" : ""}`}
                onClick={() => setChartPeriod("7d")}
              >
                7 Days
              </button>
              <button
                className={`period-btn ${chartPeriod === "30d" ? "active" : ""}`}
                onClick={() => setChartPeriod("30d")}
              >
                30 Days
              </button>
            </div>

            <button
              onClick={() => onNavigateTab("reports")}
              className="btn-restoran-secondary"
              style={{ padding: "6px 12px", fontSize: "12.5px" }}
            >
              <i className="fa fa-chart-line"></i> Full KPIs
            </button>
          </div>
        </div>

        {/* Chart Summary Stats Ribbon */}
        <div className="chart-summary-ribbon">
          <div className="ribbon-item">
            <span className="ribbon-label">Period Revenue</span>
            <span className="ribbon-value" style={{ color: "var(--primary-dark)" }}>
              KES {totalChartSales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="ribbon-item">
            <span className="ribbon-label">Period Orders</span>
            <span className="ribbon-value">{totalChartOrders} orders</span>
          </div>
          <div className="ribbon-item">
            <span className="ribbon-label">Peak Velocity</span>
            <span className="ribbon-value" style={{ color: "var(--color-info)" }}>
              KES {maxSalesInChart.toLocaleString("en-US", { minimumFractionDigits: 0 })} max
            </span>
          </div>
        </div>

        {/* Visual Chart Bars Canvas */}
        {chartLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <i className="fa fa-spinner fa-spin" style={{ fontSize: "28px", color: "var(--primary)" }}></i>
            <p style={{ marginTop: "8px", color: "var(--gray)", fontSize: "13px" }}>Querying PostgreSQL time-series analytics...</p>
          </div>
        ) : chartData.length === 0 || (totalChartSales === 0 && totalChartOrders === 0) ? (
          <div className="chart-empty-state">
            <i className="fa fa-chart-bar" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px", display: "block" }}></i>
            <p style={{ fontWeight: "700", color: "var(--secondary)", margin: "0 0 4px" }}>No Completed Sales in this Period</p>
            <p style={{ fontSize: "12.5px", color: "var(--gray)", margin: 0 }}>Transactions will automatically graph here once orders are paid and fulfilled.</p>
          </div>
        ) : (
          <div className="chart-visual-wrapper">
            <div className="chart-bars-track">
              {chartData.map((item, idx) => {
                const salesVal = Number(item.sales) || 0;
                const orderVal = Number(item.orders) || 0;
                const barHeightPercent = maxSalesInChart > 0 ? Math.max(salesVal > 0 ? 12 : 4, (salesVal / maxSalesInChart) * 100) : 4;
                const isHovered = activeBarHover === idx;

                return (
                  <div
                    key={idx}
                    className="chart-bar-column"
                    onMouseEnter={() => setActiveBarHover(idx)}
                    onMouseLeave={() => setActiveBarHover(null)}
                  >
                    {/* Hover Popover Tooltip */}
                    {isHovered && (
                      <div className="chart-bar-tooltip">
                        <div style={{ fontWeight: "800", color: "#FFFFFF", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "3px", marginBottom: "3px" }}>
                          {item.date || item.time || item.label}
                        </div>
                        <div style={{ color: "#FDE68A", fontWeight: "800", fontSize: "13px" }}>
                          KES {salesVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: "#BAE6FD", fontSize: "11px" }}>
                          {orderVal} order{orderVal === 1 ? "" : "s"}
                        </div>
                      </div>
                    )}

                    <div className="chart-bar-value-label">
                      {salesVal > 0 ? `KES ${(salesVal / 1000).toFixed(1)}k` : ""}
                    </div>

                    <div
                      className={`chart-bar-pillar ${salesVal > 0 ? "has-sales" : "zero-sales"}`}
                      style={{ height: `${barHeightPercent}%` }}
                    >
                      {orderVal > 0 && <span className="bar-order-count">{orderVal}</span>}
                    </div>

                    <div className="chart-bar-x-label">{item.label || item.dayName || item.date}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. DUAL SECTION: KITCHEN WORKLOAD + TODAY'S RESERVATIONS */}
      <div className="overview-two-col-grid">
        {/* Kitchen KDS Workload Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <i className="fa fa-fire" style={{ color: "var(--primary)" }}></i>
                Kitchen KDS Summary
              </h3>
              <p className="admin-card-desc">Active tickets currently in food preparation lifecycle.</p>
            </div>
            <button
              onClick={() => onNavigateTab("kds")}
              className="btn-restoran-primary"
              style={{ padding: "6px 14px", fontSize: "12.5px" }}
            >
              Open Kitchen →
            </button>
          </div>

          <div className="kds-pipeline-summary-grid">
            <div className="kds-stat-box kds-confirmed">
              <div className="kds-stat-label">CONFIRMED</div>
              <div className="kds-stat-number">{statusCounts.confirmed || 0}</div>
              <div className="kds-stat-sub">Queue to prep</div>
            </div>
            <div className="kds-stat-box kds-preparing">
              <div className="kds-stat-label">PREPARING</div>
              <div className="kds-stat-number">{statusCounts.preparing || 0}</div>
              <div className="kds-stat-sub">On grill & stoves</div>
            </div>
            <div className="kds-stat-box kds-ready">
              <div className="kds-stat-label">READY</div>
              <div className="kds-stat-number">{statusCounts.ready || 0}</div>
              <div className="kds-stat-sub">At pass / counter</div>
            </div>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--light-gray)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
            <span style={{ color: "var(--gray)" }}>
              Active Floor Tables: <strong>{tablesCount.occupied || 0} Occupied</strong> / {tablesCount.total ?? 0} Total
            </span>
            <button
              onClick={() => onNavigateTab("tables")}
              className="btn-link-action"
            >
              Floor Plan →
            </button>
          </div>
        </div>

        {/* Today's Reservations Desk Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <i className="fa fa-calendar-alt" style={{ color: "var(--color-info)" }}></i>
                Today's Reservations
              </h3>
              <p className="admin-card-desc">Table bookings scheduled for today.</p>
            </div>
            <button
              onClick={() => onNavigateTab("reservations")}
              className="btn-restoran-secondary"
              style={{ padding: "6px 14px", fontSize: "12.5px" }}
            >
              View Desk ({todayReservationsCount})
            </button>
          </div>

          {todayReservations.length === 0 ? (
            <div className="section-empty-box">
              <i className="fa fa-calendar-day" style={{ fontSize: "24px", color: "#94a3b8", marginBottom: "8px", display: "block" }}></i>
              <p style={{ margin: "0 0 4px", fontWeight: "700", color: "var(--secondary)" }}>No Reservations for Today</p>
              <p style={{ margin: 0, color: "var(--gray)", fontSize: "12.5px" }}>
                {pendingReservationsCount > 0
                  ? `There are ${pendingReservationsCount} unconfirmed reservations on other dates.`
                  : "Direct walk-in tables are fully available on the floor."}
              </p>
            </div>
          ) : (
            <div className="reservations-compact-list">
              {todayReservations.slice(0, 4).map((r) => (
                <div key={r.id} className="reservation-compact-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="res-time-pill">{r.reservation_time}</span>
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--secondary)", fontSize: "13.5px" }}>{r.customer_name}</div>
                      <div style={{ color: "var(--gray)", fontSize: "12px" }}>
                        {r.guest_count} guests • {r.table_number ? `Table ${r.table_number}` : "Table Unassigned"}
                      </div>
                    </div>
                  </div>
                  <span className={`status-badge status-${(r.status || "pending").toLowerCase()}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. DUAL SECTION: PAYMENT RECONCILIATION + LOW STOCK ALERTS */}
      <div className="overview-two-col-grid">
        {/* Payment Reconciliation Summary Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <i className="fa fa-file-invoice-dollar" style={{ color: "var(--color-success)" }}></i>
                Payment Reconciliation
              </h3>
              <p className="admin-card-desc">Live audit of settled and pending funds across payment gateways.</p>
            </div>
            <button
              onClick={() => onNavigateTab("reconciliation")}
              className="btn-restoran-secondary"
              style={{ padding: "6px 14px", fontSize: "12.5px" }}
            >
              Full Ledger →
            </button>
          </div>

          <div className="payment-recon-grid">
            <div className="recon-box">
              <div className="recon-box-header">
                <span className="recon-title"><i className="fa fa-mobile-alt" style={{ color: "var(--color-success)" }}></i> M-Pesa STK</span>
                <span className="recon-count">{paymentReconciliation.mpesa?.count || 0} txn</span>
              </div>
              <div className="recon-amount metric-success">
                KES {Number(paymentReconciliation.mpesa?.revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="recon-box">
              <div className="recon-box-header">
                <span className="recon-title"><i className="fa fa-wallet" style={{ color: "var(--color-warning)" }}></i> Loyalty Wallet</span>
                <span className="recon-count">{paymentReconciliation.wallet?.count || 0} txn</span>
              </div>
              <div className="recon-amount" style={{ color: "var(--color-warning)" }}>
                KES {Number(paymentReconciliation.wallet?.revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="recon-box">
              <div className="recon-box-header">
                <span className="recon-title"><i className="fa fa-clock" style={{ color: "#eab308" }}></i> Pending / In-Flight</span>
                <span className="recon-count">{paymentReconciliation.pending?.count || 0} txn</span>
              </div>
              <div className="recon-amount" style={{ color: "#ca8a04" }}>
                KES {Number(paymentReconciliation.pending?.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="recon-box">
              <div className="recon-box-header">
                <span className="recon-title"><i className="fa fa-times-circle" style={{ color: "var(--color-danger)" }}></i> Failed Payments</span>
                <span className="recon-count">{paymentReconciliation.failed?.count || 0} txn</span>
              </div>
              <div className="recon-amount" style={{ color: "var(--color-danger)" }}>
                KES {Number(paymentReconciliation.failed?.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Low-Stock Inventory Alerts Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <i className="fa fa-boxes" style={{ color: "var(--color-warning)" }}></i>
                Inventory Restock Alerts
              </h3>
              <p className="admin-card-desc">Ingredients reaching minimum buffer thresholds.</p>
            </div>
            <button
              onClick={() => onNavigateTab("inventory")}
              className="btn-restoran-secondary"
              style={{ padding: "6px 14px", fontSize: "12.5px" }}
            >
              Manage Inventory →
            </button>
          </div>

          {lowStockAlerts.length === 0 ? (
            <div className="section-empty-box" style={{ background: "rgba(46, 125, 50, 0.05)", border: "1px solid rgba(46, 125, 50, 0.15)" }}>
              <i className="fa fa-check-circle" style={{ fontSize: "24px", color: "var(--color-success)", marginBottom: "8px", display: "block" }}></i>
              <p style={{ margin: "0 0 4px", fontWeight: "700", color: "var(--color-success)" }}>Healthy Ingredient Reserves</p>
              <p style={{ margin: 0, color: "var(--gray)", fontSize: "12.5px" }}>All kitchen pantry items and raw ingredients are stocked above minimum limits.</p>
            </div>
          ) : (
            <div className="low-stock-list">
              {lowStockAlerts.slice(0, 4).map((item) => (
                <div key={item.id} className="low-stock-row">
                  <div>
                    <div style={{ fontWeight: "700", color: "var(--secondary)", fontSize: "13.5px" }}>{item.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--gray)" }}>Supplier: {item.supplier || "Standard Supply"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="stock-alert-badge">
                      {item.current_quantity} {item.unit} (Min: {item.min_stock_level})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. DUAL SECTION: BEST SELLING MENU ITEMS + QUICK ACTIONS */}
      <div className="overview-two-col-grid">
        {/* Top-Selling Dishes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <i className="fa fa-utensils" style={{ color: "var(--primary)" }}></i>
                Best-Selling Menu Items
              </h3>
              <p className="admin-card-desc">Ranked by actual paid diner orders and total volume.</p>
            </div>
            <button
              onClick={() => onNavigateTab("menu")}
              className="btn-restoran-secondary"
              style={{ padding: "6px 14px", fontSize: "12.5px" }}
            >
              Menu Catalog →
            </button>
          </div>

          {popularItems.length === 0 ? (
            <div className="section-empty-box">
              <i className="fa fa-utensils" style={{ fontSize: "24px", color: "#94a3b8", marginBottom: "8px", display: "block" }}></i>
              <p style={{ margin: 0, color: "var(--gray)", fontSize: "13px" }}>No dish sales recorded yet in PostgreSQL.</p>
            </div>
          ) : (
            <div className="top-dishes-list">
              {popularItems.map((item, idx) => (
                <div key={item.name} className="top-dish-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className={`dish-rank-badge ${idx === 0 ? "rank-gold" : idx === 1 ? "rank-silver" : idx === 2 ? "rank-bronze" : ""}`}>
                      {idx + 1}
                    </div>
                    <div style={{ fontWeight: "700", color: "var(--secondary)", fontSize: "13.5px" }}>{item.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: "800", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif", fontSize: "14px" }}>
                      {item.quantity} sold
                    </span>
                    <span style={{ display: "block", color: "var(--gray)", fontSize: "11.5px" }}>
                      KES {Number(item.revenue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations Actions Bar */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <i className="fa fa-bolt" style={{ color: "var(--primary)" }}></i>
                Operational Quick Shortcuts
              </h3>
              <p className="admin-card-desc">Role-authorized fast actions for management and staff.</p>
            </div>
          </div>

          <div className="quick-actions-grid">
            {(userRole === "owner" || userRole === "manager") && (
              <button onClick={() => onNavigateTab("menu")} className="quick-action-btn">
                <i className="fa fa-plus-circle" style={{ color: "var(--primary)" }}></i>
                <span>Add Menu Item</span>
              </button>
            )}

            {(userRole === "owner" || userRole === "manager" || userRole === "waiter") && (
              <button onClick={() => onNavigateTab("reservations")} className="quick-action-btn">
                <i className="fa fa-calendar-plus" style={{ color: "var(--color-info)" }}></i>
                <span>New Reservation</span>
              </button>
            )}

            {(userRole === "owner" || userRole === "manager") && (
              <button onClick={() => onNavigateTab("inventory")} className="quick-action-btn">
                <i className="fa fa-box-open" style={{ color: "var(--color-warning)" }}></i>
                <span>Add Inventory</span>
              </button>
            )}

            <button onClick={() => onNavigateTab("orders")} className="quick-action-btn">
              <i className="fa fa-receipt" style={{ color: "var(--primary-dark)" }}></i>
              <span>View All Orders</span>
            </button>

            {(userRole === "owner" || userRole === "manager" || userRole === "kitchen") && (
              <button onClick={() => onNavigateTab("kds")} className="quick-action-btn">
                <i className="fa fa-fire" style={{ color: "#ef4444" }}></i>
                <span>Open Kitchen KDS</span>
              </button>
            )}

            {(userRole === "owner" || userRole === "manager" || userRole === "cashier" || userRole === "accountant") && (
              <button onClick={() => onNavigateTab("reconciliation")} className="quick-action-btn">
                <i className="fa fa-file-invoice-dollar" style={{ color: "var(--color-success)" }}></i>
                <span>View Payments</span>
              </button>
            )}

            {(userRole === "owner" || userRole === "manager" || userRole === "accountant") && (
              <button onClick={() => onNavigateTab("reports")} className="quick-action-btn">
                <i className="fa fa-chart-line" style={{ color: "#8b5cf6" }}></i>
                <span>View Reports & KPIs</span>
              </button>
            )}

            {(userRole === "owner" || userRole === "manager" || userRole === "accountant") && (
              <button onClick={() => onNavigateTab("audit")} className="quick-action-btn">
                <i className="fa fa-history" style={{ color: "#64748b" }}></i>
                <span>Audit Trail</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 7. RECENT ORDERS & GUEST TRANSACTIONS TABLE */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="admin-card-title">
              <i className="fa fa-receipt" style={{ color: "var(--primary)" }}></i>
              Recent Orders & Guest Transactions
            </h3>
            <p className="admin-card-desc">Live order stream showing diner items, tables, and fulfillment status.</p>
          </div>
          <button
            onClick={() => onNavigateTab("orders")}
            className="btn-restoran-primary"
            style={{ padding: "6px 14px", fontSize: "12.5px" }}
          >
            Manage All Orders →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="section-empty-box">
            <p style={{ margin: 0, color: "var(--gray)" }}>No orders found in database.</p>
          </div>
        ) : (
          <div className="admin-data-table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items Ordered</th>
                  <th>Type / Table</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Fulfillment</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const itemsSummary = Array.isArray(o.items) && o.items.length > 0
                    ? o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")
                    : "—";

                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: "800", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif" }}>
                        #{o.id}
                      </td>
                      <td style={{ fontWeight: "600", color: "var(--secondary)" }}>
                        {o.user_name || "Guest Customer"}
                      </td>
                      <td style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12.5px", color: "var(--secondary)" }} title={itemsSummary}>
                        {itemsSummary}
                      </td>
                      <td>
                        <span className="order-type-tag">
                          {o.table_number ? `Table ${o.table_number}` : o.order_type || "Dine-In"}
                        </span>
                      </td>
                      <td style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>
                        KES {Number(o.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`status-badge status-${(o.status || "pending").toLowerCase()}`}>
                          {o.status} ({o.payment_method})
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${(o.fulfillment_status || "confirmed").toLowerCase().replace(/\s+/g, "-")}`}>
                          {o.fulfillment_status || "Confirmed"}
                        </span>
                      </td>
                      <td style={{ color: "var(--gray)", fontSize: "12px", whiteSpace: "nowrap" }}>
                        {new Date(o.created_at).toLocaleDateString([], { month: "short", day: "numeric" })} • {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <button
                          onClick={() => onNavigateTab("orders")}
                          className="btn-restoran-secondary"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

