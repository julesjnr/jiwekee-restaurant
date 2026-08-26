import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function Stats() {
  const [stats, setStats] = useState({
    experience: 15,
    popularChefs: 50,
    satisfiedCustomers: 12000,
    diningTables: 45,
  });

  useEffect(() => {
    // Optionally fetch dynamic statistics from backend
    api
      .getStats()
      .then((data) => {
        if (data) {
          setStats((prev) => ({
            ...prev,
            satisfiedCustomers: data.total_orders ? Math.max(12000, data.total_orders * 150) : 12000,
            diningTables: data.active_tables ? Math.max(30, data.active_tables * 5) : 45,
          }));
        }
      })
      .catch(() => {
        // Use default numbers if offline
      });
  }, []);

  const statItems = [
    {
      icon: "fa-user-tie",
      count: stats.experience,
      suffix: "+",
      label: "Years of",
      title: "EXPERIENCE",
    },
    {
      icon: "fa-utensils",
      count: stats.popularChefs,
      suffix: "",
      label: "Popular",
      title: "MASTER CHEFS",
    },
    {
      icon: "fa-smile-beam",
      count: stats.satisfiedCustomers.toLocaleString(),
      suffix: "+",
      label: "Delighted",
      title: "HAPPY CLIENTS",
    },
    {
      icon: "fa-chair",
      count: stats.diningTables,
      suffix: "+",
      label: "Exclusive",
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
