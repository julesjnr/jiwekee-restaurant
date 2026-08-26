import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem, cart } = useCart();

  useEffect(() => {
    api
      .getMenu()
      .then((data) => {
        setItems(data.items || []);
        setCategories(["All", ...(data.categories || [])]);
      })
      .catch(() =>
        setError("Our kitchen is currently prepping new options. Please check back shortly!")
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCartQuantity = (id) => {
    if (!cart) return 0;
    // `cart` is stored as an object map of itemId -> quantity in CartContext
    // ensure we handle string/number keys consistently
    return Number(cart[id] || cart[String(id)] || 0);
  };

  const scrollToMenu = () => {
    const el = document.getElementById("menu-catalog");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main>
      {/* Premium Homepage Hero Banner */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-eyebrow">
              AUTHENTIC FLAVOURS
            </div>
            <h1 className="hero-title">
              Made for sharing. <br />
              Made with <span>flavour</span>.
            </h1>
            <p className="hero-description">
              Welcome to Jiwekee Tavern & Grill. Savor artisanal open-flame Nyama Choma, rich Swahili Biryani, coastal seafood, and fresh refreshments prepared with genuine Kenyan warmth.
            </p>

            <div className="hero-cta-group">
              <button onClick={scrollToMenu} className="btn-hero-primary">
                Order Now →
              </button>
              <Link to="/reservations" className="btn-hero-secondary">
                Reserve a Table
              </Link>
            </div>

            <div className="hero-features-list">
              <div className="hero-feature-item">
                Open Charcoal Grill
              </div>
              <div className="hero-feature-item">
                Instant M-Pesa STK
              </div>
              <div className="hero-feature-item">
                Earn Loyalty Points
              </div>
            </div>
          </div>

          <div className="hero-visual-card">
            <img
              src="/images/choma.jpg"
              alt="Jiwekee Signature Nyama Choma"
              className="hero-visual-image"
              onError={(e) => {
                e.target.src = "/images/biryani.jpg";
              }}
            />
            <div className="hero-floating-badge">
              <div>
                <div className="floating-badge-title">Chef's Signature Platter</div>
                <div className="floating-badge-subtitle">Charcoal Grilled Goat & Kachumbari</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Menu Catalog Section */}
      <section id="menu-catalog" className="menu-page-wrapper">
        <div className="menu-header-center">
          <div className="section-eyebrow">OUR CULINARY SELECTION</div>
          <h2 className="section-title">Explore Our Handcrafted Menu</h2>
          <p className="section-subtitle">
            Every dish is freshly prepared to order. Select your favorites to build your dining platter for dine-in, takeaway, or direct delivery.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="menu-search-toolbar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search platters, grilled cuts, Swahili curries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {categories.length > 1 && (
            <div className="category-scroll-container">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`category-pill-btn ${activeCategory === cat ? "active" : ""}`}
                >
                  {cat === "All" ? "All Dishes" : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* States */}
        {loading && <p className="loading-notice">Preparing authentic dishes from the kitchen...</p>}
        {error && <div className="no-items-card">{error}</div>}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="no-items-card">
            <h3>No dishes found</h3>
            <p style={{ marginTop: "8px" }}>
              No culinary items matching "{searchTerm}". Try clearing your search or picking another category.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("All");
              }}
              className="btn-action-sm btn-action-primary"
              style={{ marginTop: "16px" }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Menu Cards Grid */}
        <div className="menu-cards-grid">
          {filteredItems.map((item) => {
            const qtyInCart = getCartQuantity(item.id);
            const isSoldOut = item.is_available === false;

            return (
              <article className="menu-card" key={item.id}>
                <div className="food-image-wrapper">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/images/choma.jpg";
                    }}
                  />
                  <div className="food-badge-container">
                    {item.is_featured && <span className="badge-featured">Chef's Pick</span>}
                    {item.prep_time_minutes && (
                      <span className="badge-prep-time">{item.prep_time_minutes} min</span>
                    )}
                    {item.category && <span className="badge-category">{item.category}</span>}
                  </div>
                  <span className="price-tag-badge">KES {Number(item.price).toFixed(2)}</span>
                </div>

                <div className="food-info-panel">
                  <h3 className="food-title">{item.name}</h3>
                  <p className="food-description">{item.description}</p>

                  <div className="card-action-bottom">
                    {isSoldOut ? (
                      <button disabled className="btn-sold-out">
                        Currently Sold Out
                      </button>
                    ) : (
                      <button
                        className={`btn-add-cart ${qtyInCart > 0 ? "in-cart" : ""}`}
                        onClick={() => addItem(item.id)}
                      >
                        {qtyInCart > 0 ? `✓ Added (${qtyInCart} in Platter) +` : "+ Add to Platter"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
