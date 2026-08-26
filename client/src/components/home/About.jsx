import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="restoran-about-section" id="about">
      <div className="restoran-about-grid">
        {/* 4-Image Collage from Restoran Template */}
        <div className="about-img-collage">
          <div className="about-img-item collage-item-1">
            <img
              src="/img/about-1.jpg"
              alt="Jiwekee Gourmet Preparation"
              onError={(e) => {
                e.target.src = "/images/choma.jpg";
              }}
            />
          </div>
          <div className="about-img-item collage-item-2">
            <img
              src="/img/about-2.jpg"
              alt="Flame Grilling & Craft"
              onError={(e) => {
                e.target.src = "/images/biryani.jpg";
              }}
            />
          </div>
          <div className="about-img-item collage-item-3">
            <img
              src="/img/about-3.jpg"
              alt="Fine Dining Experience"
              onError={(e) => {
                e.target.src = "/images/fish.jpg";
              }}
            />
          </div>
          <div className="about-img-item collage-item-4">
            <img
              src="/img/about-4.jpg"
              alt="Artisanal Fresh Ingredients"
              onError={(e) => {
                e.target.src = "/images/pizza.jpg";
              }}
            />
          </div>
        </div>

        {/* Text & Statistics Details */}
        <div className="about-text-content">
          <h5 className="restoran-section-title title-start">About Us</h5>
          <h2 className="about-heading">
            Welcome to{" "}
            <span>
              <i className="fa fa-utensils"></i>Jiwekee
            </span>{" "}
            Tavern & Grill
          </h2>
          <p className="about-desc">
            Rooted in Nairobi’s vibrant culinary culture, Jiwekee brings together authentic open-flame Nyama Choma, signature coastal Swahili spices, and modern gourmet hospitality. Every platter is seasoned with passion, tradition, and fresh regional ingredients.
          </p>
          <p className="about-desc" style={{ marginBottom: "20px" }}>
            Whether you’re planning a family celebration, an intimate evening, or a swift online order delivered right to your doorstep, our kitchen delivers memorable flavors every single time.
          </p>

          {/* Statistics Counter Boxes */}
          <div className="about-stats-container">
            <div className="about-stat-box">
              <span className="about-stat-number">15</span>
              <div className="about-stat-label">
                Years of
                <strong>EXPERIENCE</strong>
              </div>
            </div>

            <div className="about-stat-box">
              <span className="about-stat-number">50</span>
              <div className="about-stat-label">
                Popular
                <strong>MASTER CHEFS</strong>
              </div>
            </div>
          </div>

          <Link to="/menu" className="btn-book-nav" style={{ padding: "14px 34px" }}>
            Read More / Explore Menu
          </Link>
        </div>
      </div>
    </section>
  );
}
