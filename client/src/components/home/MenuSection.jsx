import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useCart } from "../../context/CartContext";

const FALLBACK_DISH_IMAGES = [
  "/img/menu-1.jpg",
  "/img/menu-2.jpg",
  "/img/menu-3.jpg",
  "/img/menu-4.jpg",
  "/img/menu-5.jpg",
  "/img/menu-6.jpg",
  "/img/menu-7.jpg",
  "/img/menu-8.jpg",
];

export default function MenuSection() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { cart, addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    api
      .getMenu()
      .then((data) => {
        setItems(data.items || []);
        const cats = ["All", ...(data.categories || []).filter((c) => c !== "All")];
        setCategories(cats);
      })
      .catch((err) => console.error("Menu load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter((item) => {
    if (activeCategory === "All") return true;
    return item.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  const getCategoryIcon = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes("breakfast") || c.includes("morning") || c.includes("mahamri")) return "fa-coffee";
    if (c.includes("grill") || c.includes("meat") || c.includes("choma")) return "fa-hamburger";
    if (c.includes("swahili") || c.includes("classic") || c.includes("biryani")) return "fa-utensils";
    if (c.includes("pizza")) return "fa-pizza-slice";
    if (c.includes("seafood") || c.includes("fish")) return "fa-fish";
    if (c.includes("dessert") || c.includes("beverage") || c.includes("drink")) return "fa-cocktail";
    return "fa-concierge-bell";
  };

  return (
    <section className="restoran-menu-section" id="menu">
      <div className="section-header-center">
        <h5 className="restoran-section-title">Food Menu</h5>
        <h2 className="section-main-heading">
          Most Popular Dishes
        </h2>
      </div>

      {/* Restoran Category Tabs Navigation */}
      <div className="restoran-menu-nav">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`restoran-menu-tab ${activeCategory === cat ? "active" : ""}`}
            type="button"
          >
            <i className={`fa ${getCategoryIcon(cat)}`}></i>
            <div className="tab-text-group">
              <small className="tab-small-label">Special</small>
              <strong className="tab-main-label">{cat}</strong>
            </div>
          </button>
        ))}
      </div>

      {/* Dishes Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-muted)" }}>
          <i
            className="fa fa-spinner fa-spin fa-2x"
            style={{ color: "var(--restoran-primary)", marginBottom: "12px", display: "block" }}
          ></i>
          <p style={{ fontWeight: "600" }}>Loading chef's specialties from database...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-muted)" }}>
          <p>No dishes found in this category.</p>
        </div>
      ) : (
        <div className="restoran-menu-grid">
          {filteredItems.slice(0, 8).map((item, index) => {
            const countInCart = cart[item.id] || 0;
            const fallbackImg = FALLBACK_DISH_IMAGES[index % FALLBACK_DISH_IMAGES.length];
            const imgSrc = item.image_url || fallbackImg;

            return (
              <div key={item.id} className="restoran-menu-item">
                <img
                  src={imgSrc}
                  alt={item.name}
                  className="restoran-menu-img"
                  onError={(e) => {
                    e.target.src = fallbackImg;
                  }}
                />
                <div className="restoran-menu-content">
                  <div className="restoran-menu-top">
                    <h5 className="restoran-menu-title">{item.name}</h5>
                    <span className="restoran-menu-price">
                      KES {Number(item.price).toFixed(0)}
                    </span>
                  </div>
                  <p className="restoran-menu-desc">
                    {item.description || "Freshly seasoned with signature spices and traditional preparation."}
                  </p>
                  <div className="restoran-menu-bottom">
                    <span className="prep-time-tag">
                      ⏱️ {item.prep_time_minutes || 15} mins
                    </span>
                    <button
                      onClick={() => addItem(item.id)}
                      className="btn-action-sm btn-action-primary btn-menu-add"
                      type="button"
                    >
                      <i className="fa fa-plus"></i>
                      <span>{countInCart > 0 ? `In Cart (${countInCart})` : "Add"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Menu Link */}
      <div style={{ textAlign: "center", marginTop: "48px" }}>
        <Link to="/menu" className="btn-book-nav" style={{ padding: "14px 38px", fontSize: "15px" }}>
          <i className="fa fa-utensils"></i>
          <span>View Full Catalog ({items.length} Dishes)</span>
        </Link>
      </div>
    </section>
  );
}
