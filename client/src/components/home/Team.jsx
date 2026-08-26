export default function Team() {
  const chefs = [
    {
      name: "Chef Julius O.",
      role: "Executive Grill Master",
      image: "/img/team-1.jpg",
    },
    {
      name: "Chef Amina Hassan",
      role: "Swahili Coastal Specialist",
      image: "/img/team-2.jpg",
    },
    {
      name: "Chef David Mwangi",
      role: "Head Pastry & Dessert Chef",
      image: "/img/team-3.jpg",
    },
    {
      name: "Chef Peter Odhiambo",
      role: "Seafood & Tilapia Artisan",
      image: "/img/team-4.jpg",
    },
  ];

  return (
    <section className="restoran-team-section" id="team">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h5 className="restoran-section-title">Team Members</h5>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontWeight: "800", color: "var(--restoran-dark)" }}>
          Our Master Chefs
        </h2>
      </div>

      <div className="restoran-team-grid">
        {chefs.map((chef, idx) => (
          <div key={idx} className="restoran-team-card">
            <div className="team-img-wrap">
              <img
                src={chef.image}
                alt={chef.name}
                onError={(e) => {
                  e.target.src = "/images/choma.jpg";
                }}
              />
            </div>
            <div className="team-info-box">
              <h5 className="team-name">{chef.name}</h5>
              <p className="team-role">{chef.role}</p>
              <div className="team-socials">
                <a href="#facebook" className="team-social-btn" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#twitter" className="team-social-btn" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#instagram" className="team-social-btn" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
