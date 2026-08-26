export default function Testimonials() {
  const reviews = [
    {
      text: "The goat Nyama Choma and Kachumbari was phenomenal! The charcoal smoke flavor is completely authentic and the service was top notch.",
      name: "Brenda Wanjiku",
      role: "Food Enthusiast & Blogger",
      avatar: "/img/testimonial-1.jpg",
    },
    {
      text: "Fastest online order in Kilimani. The Swahili Biryani arrived piping hot with tender chicken. Instant M-Pesa checkout made it so easy!",
      name: "Kevin Otieno",
      role: "Tech Entrepreneur",
      avatar: "/img/testimonial-2.jpg",
    },
    {
      text: "Booked a table for our anniversary dinner. The ambiance, the warm hospitality, and the Tilapia wet fry were nothing short of perfection.",
      name: "Sarah & Mike",
      role: "Regular Diners",
      avatar: "/img/testimonial-3.jpg",
    },
    {
      text: "Outstanding catering and private dining experience. The executive chef customized the tasting menu flawlessly for our corporate banquet.",
      name: "David Kimani",
      role: "Corporate Executive",
      avatar: "/img/testimonial-4.jpg",
    },
  ];

  return (
    <section className="restoran-testimonials-section" id="testimonials">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h5 className="restoran-section-title">Testimonial</h5>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontWeight: "800", color: "var(--restoran-dark)" }}>
          Our Clients Say!!!
        </h2>
      </div>

      <div className="restoran-testimonials-grid">
        {reviews.map((rev, idx) => (
          <div key={idx} className="restoran-testimonial-card">
            <i className="fa fa-quote-left testimonial-quote-icon"></i>
            <p className="testimonial-text">"{rev.text}"</p>
            <div className="testimonial-client">
              <img
                src={rev.avatar}
                alt={rev.name}
                className="testimonial-avatar"
                onError={(e) => {
                  e.target.src = "/images/biryani.jpg";
                }}
              />
              <div>
                <h5 className="client-name">{rev.name}</h5>
                <span className="client-profession">{rev.role}</span>
                <div style={{ color: "var(--restoran-primary)", fontSize: "12px", marginTop: "3px" }}>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
