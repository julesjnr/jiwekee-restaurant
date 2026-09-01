import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function Stats() {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_customers: 0,
    total_tables: 0,
    menu_dishes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStats()
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error("Home stats error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const statItems = [
    {
      icon: "fa-shopping-bag",
      count: stats.total_orders ?? 0,
      suffix: stats.total_orders > 0 ? "+" : "",
      label: "Fulfilled",
      title: "DINER ORDERS",
    },
    {
      icon: "fa-utensils",
      count: stats.menu_dishes ?? 0,
      suffix: stats.menu_dishes > 0 ? "+" : "",
      label: "Chef's Signature",
      title: "GOURMET DISHES",
    },
    {
      icon: "fa-users",
      count: stats.total_customers ?? 0,
      suffix: stats.total_customers > 0 ? "+" : "",
      label: "Registered",
      title: "LOYAL DINERS",
    },
    {
      icon: "fa-chair",
      count: stats.total_tables ?? 0,
      suffix: stats.total_tables > 0 ? "+" : "",
      label: "Restaurant",
      title: "DINING TABLES",
    },
  ];

  return (
    <section className="restoran-counter-section">
      <div className="restoran-counter-container">
        <div className="restoran-counter-grid">
          {statItems.map((item, idx) => (
            <div key={idx} className="restoran-counter-card">
              <div className="counter-icon-wrap">
                <i className={`fa ${item.icon}`}></i>
              </div>
              <div className="counter-text-wrap">
                <h2 className="counter-number">
                  {item.count}
                  <span className="counter-suffix">{item.suffix}</span>
                </h2>
                <div className="counter-meta">
                  <span className="counter-label">{item.label}</span>
                  <strong className="counter-title">{item.title}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
