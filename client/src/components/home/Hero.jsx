import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="restoran-hero" id="home">
      <div className="restoran-hero-inner">
        {/* Left Copy & CTA Actions */}
        <div className="hero-content-col">
          <h1 className="hero-main-title">
            Enjoy Our<br />
            <span>Delicious Meal</span>
          </h1>
          <p className="hero-main-desc">
            Welcome to Jiwekee Tavern & Grill. Savor the authentic aroma of open-flame Swahili Nyama Choma, rich coastal biryanis, and artisanal delicacies prepared fresh daily by our master chefs.
          </p>
          <div className="hero-btn-group">
            <Link to="/reservations" className="btn-book-nav btn-hero-action">
              <i className="fa fa-calendar-alt"></i>
              <span>Book A Table</span>
            </Link>
            <Link to="/menu" className="btn-book-nav btn-hero-outline">
              <i className="fa fa-utensils"></i>
              <span>Explore Menu</span>
            </Link>
          </div>
        </div>

        {/* Right Rotating Plate Animation from Restoran Template */}
        <div className="hero-plate-container">
          <div className="hero-plate-glow"></div>
          <img
            src="/img/hero.png"
            alt="Jiwekee Signature Delicacy"
            className="hero-plate-img"
            onError={(e) => {
              e.target.src = "/images/biryani.jpg";
            }}
          />
        </div>
      </div>
    </section>
  );
}
