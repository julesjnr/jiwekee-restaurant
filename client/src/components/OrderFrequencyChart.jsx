import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function OrderFrequencyChart({ orders: initialOrders = null }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(initialOrders === null);
  const [fetchError, setFetchError] = useState("");
  const [viewMode, setViewMode] = useState("daily"); // "daily" (30 days) | "weekly" (last 4 weeks)
  const [activeBarIndex, setActiveBarIndex] = useState(null);

  const fetchOrdersFromBackend = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");
      const data = await api.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setFetchError(err.message || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrders !== null) {
      setOrders(initialOrders);
      setLoading(false);
    } else {
      fetchOrdersFromBackend();
    }
  }, [initialOrders, fetchOrdersFromBackend]);

  // Generate 30-day timeline analysis
  const chartAnalytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Initialize 30 day map
    const dailyMap = new Map();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const displayLabel = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      dailyMap.set(key, {
        date: key,
        displayLabel,
        weekday,
        orderCount: 0,
        totalSpent: 0,
        orders: [],
      });
    }

    let ordersInLast30Days = 0;
    let spentInLast30Days = 0;

    // Aggregate orders
    (orders || []).forEach((ord) => {
      if (!ord.created_at) return;
      const ordDate = new Date(ord.created_at);
      const key = ordDate.toISOString().split("T")[0];

      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key);
        entry.orderCount += 1;
        const amount = Number(ord.amount) || 0;
        entry.totalSpent += amount;
        entry.orders.push(ord);
        ordersInLast30Days += 1;
        spentInLast30Days += amount;
      }
    });

    const dailyData = Array.from(dailyMap.values());

    // Aggregate into 4 weekly chunks
    const weeklyData = [
      { label: "Week 1 (22-30d ago)", orderCount: 0, totalSpent: 0 },
      { label: "Week 2 (15-21d ago)", orderCount: 0, totalSpent: 0 },
      { label: "Week 3 (8-14d ago)", orderCount: 0, totalSpent: 0 },
      { label: "Week 4 (Past 7d)", orderCount: 0, totalSpent: 0 },
    ];

    dailyData.forEach((day, index) => {
      const weekIdx = Math.min(3, Math.floor(index / 7.5));
      if (weeklyData[weekIdx]) {
        weeklyData[weekIdx].orderCount += day.orderCount;
        weeklyData[weekIdx].totalSpent += day.totalSpent;
      }
    });

    // Calculate active dining days and streak metrics
    const activeDays = dailyData.filter((d) => d.orderCount > 0).length;
    const avgOrderValue =
      ordersInLast30Days > 0 ? spentInLast30Days / ordersInLast30Days : 0;

    return {
      dailyData,
      weeklyData,
      totalOrders30d: ordersInLast30Days,
      totalSpent30d: spentInLast30Days,
      activeDays,
      avgOrderValue,
      hasAnyOrders: orders && orders.length > 0,
    };
  }, [orders]);

  const activeDataset =
    viewMode === "daily"
      ? chartAnalytics.dailyData
      : chartAnalytics.weeklyData.map((w) => ({
          displayLabel: w.label,
          orderCount: w.orderCount,
          totalSpent: w.totalSpent,
        }));

  const maxOrders = Math.max(...activeDataset.map((d) => d.orderCount), 1);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          id="recharts-custom-tooltip"
          style={{
            background: "var(--color-primary)",
            color: "#FFFFFF",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 6px 18px rgba(23, 20, 18, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: "12.5px",
          }}
        >
          <div style={{ fontWeight: "700", color: "var(--color-accent-light)", marginBottom: "4px" }}>
            {data.displayLabel} {data.weekday ? `(${data.weekday})` : ""}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "2px" }}>
            <span style={{ color: "#D6CBC0" }}>Orders Placed:</span>
            <strong style={{ color: "#FFFFFF" }}>{data.orderCount} {data.orderCount === 1 ? "order" : "orders"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: "#D6CBC0" }}>Total Spent:</span>
            <strong style={{ color: "var(--color-accent)" }}>KES {Number(data.totalSpent || 0).toFixed(2)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div
        id="dashboard-order-frequency-section-loading"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 24px",
          marginBottom: "32px",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        <p style={{ fontSize: "14px", margin: 0 }}>Loading your 30-day dining activity...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        id="dashboard-order-frequency-section-error"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          marginBottom: "32px",
        }}
      >
        <div className="form-error" style={{ margin: 0 }}>
          {fetchError} —{" "}
          <button
            type="button"
            onClick={fetchOrdersFromBackend}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-accent)",
              fontWeight: "700",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="dashboard-order-frequency-section"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginBottom: "32px",
        boxShadow: "var(--shadow-subtle)",
      }}
    >
      {/* Section Header with Title, Badges, and Mode Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2
              id="order-frequency-chart-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                color: "var(--color-primary)",
                margin: 0,
              }}
            >
              30-Day Dining & Order Activity
            </h2>
            <span
              style={{
                background: "var(--color-accent-soft)",
                color: "var(--color-accent)",
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Engagement Trends
            </span>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13.5px", margin: "4px 0 0" }}>
            Track your dining frequency, platter orders, and spend consistency over the last 30 days.
          </p>
        </div>

        {/* View Mode Toggle Button Group */}
        <div
          id="chart-view-mode-toggle"
          style={{
            display: "inline-flex",
            background: "var(--color-surface-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
            gap: "2px",
          }}
        >
          <button
            id="toggle-daily-view-btn"
            type="button"
            onClick={() => setViewMode("daily")}
            style={{
              border: "none",
              background: viewMode === "daily" ? "var(--color-primary)" : "transparent",
              color: viewMode === "daily" ? "#FFFFFF" : "var(--color-text-muted)",
              fontSize: "12px",
              fontWeight: "700",
              padding: "6px 14px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Daily (30 Days)
          </button>
          <button
            id="toggle-weekly-view-btn"
            type="button"
            onClick={() => setViewMode("weekly")}
            style={{
              border: "none",
              background: viewMode === "weekly" ? "var(--color-primary)" : "transparent",
              color: viewMode === "weekly" ? "#FFFFFF" : "var(--color-text-muted)",
              fontSize: "12px",
              fontWeight: "700",
              padding: "6px 14px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Weekly Summary
          </button>
        </div>
      </div>

      {/* Engagement Quick Stats Metrics Grid */}
      <div
        id="order-frequency-metrics-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "var(--color-surface-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
            30-Day Orders
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-primary)", marginTop: "2px" }}>
            {chartAnalytics.totalOrders30d} <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--color-text-muted)" }}>orders</span>
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
            Active Days
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-accent)", marginTop: "2px" }}>
            {chartAnalytics.activeDays} <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--color-text-muted)" }}>/ 30 days</span>
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
            30-Day Spend
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-primary)", marginTop: "2px" }}>
            KES {chartAnalytics.totalSpent30d.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
            Avg Order Value
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-success)", marginTop: "2px" }}>
            KES {Math.round(chartAnalytics.avgOrderValue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart Canvas Container */}
      <div
        id="recharts-bar-chart-container"
        style={{
          width: "100%",
          height: "260px",
          position: "relative",
          marginTop: "10px",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={activeDataset}
            margin={{ top: 10, right: 10, left: -20, bottom: 24 }}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setActiveBarIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveBarIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D9" />
            <XAxis
              dataKey="displayLabel"
              interval={viewMode === "daily" ? 3 : 0}
              tick={{ fontSize: 11, fill: "#7A6F68", fontWeight: 500 }}
              tickLine={{ stroke: "#D8D0C7" }}
              axisLine={{ stroke: "#D8D0C7" }}
              angle={viewMode === "daily" ? -35 : 0}
              textAnchor={viewMode === "daily" ? "end" : "middle"}
              height={30}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.max(maxOrders + 1, 4)]}
              tick={{ fontSize: 11, fill: "#7A6F68", fontWeight: 500 }}
              tickLine={{ stroke: "#D8D0C7" }}
              axisLine={{ stroke: "#D8D0C7" }}
              unit=" ord"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(201, 107, 50, 0.08)" }} />
            <Bar
              dataKey="orderCount"
              radius={[4, 4, 0, 0]}
              maxBarSize={viewMode === "daily" ? 18 : 46}
              animationDuration={800}
            >
              {activeDataset.map((entry, index) => {
                const isHovered = activeBarIndex === index;
                const hasOrders = entry.orderCount > 0;
                let barFill = "#E6DCD1"; // Base neutral for zero days
                if (hasOrders) {
                  barFill = isHovered ? "#9E4D1D" : "#C96B32"; // Jiwekee Terracotta
                } else if (isHovered) {
                  barFill = "#D4C7BA";
                }
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={barFill}
                    style={{ transition: "fill 0.2s ease" }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Empty State / Motivation Banner */}
      {chartAnalytics.totalOrders30d === 0 ? (
        <div
          id="order-frequency-empty-state"
          style={{
            marginTop: "16px",
            padding: "16px 20px",
            background: "var(--color-surface-soft)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ fontWeight: "700", color: "var(--color-primary)", fontSize: "14px" }}>
              No orders placed in the last 30 days
            </div>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "13px" }}>
              Order your favorite nyama choma, biryani, or platters to ignite your dining streak and earn instant loyalty cash!
            </p>
          </div>

          <Link
            to="/menu"
            id="chart-empty-explore-btn"
            className="btn-add-cart"
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Explore Menu & Order →
          </Link>
        </div>
      ) : (
        <div
          id="order-frequency-motivation-banner"
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "var(--color-surface-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              {chartAnalytics.totalOrders30d >= 5
                ? `Outstanding dining streak! You've placed ${chartAnalytics.totalOrders30d} orders in the last 30 days and unlocked premium loyalty perks.`
                : `You've placed ${chartAnalytics.totalOrders30d} ${chartAnalytics.totalOrders30d === 1 ? "order" : "orders"} in 30 days. Place ${Math.max(1, 5 - chartAnalytics.totalOrders30d)} more to level up to Gold VIP status!`}
            </span>
          </div>

          <Link
            to="/menu"
            id="chart-explore-menu-cta"
            style={{
              fontSize: "12.5px",
              fontWeight: "700",
              color: "var(--color-accent)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Explore Platter Menu →
          </Link>
        </div>
      )}
    </div>
  );
}

