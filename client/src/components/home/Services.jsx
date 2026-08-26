export default function Services() {
  const services = [
    {
      icon: "fa-user-tie",
      title: "Master Chefs",
      description: "Our executive grill masters bring over 15 years of Swahili and pan-African culinary craftsmanship.",
    },
    {
      icon: "fa-utensils",
      title: "Quality Food",
      description: "Organic locally sourced meats, fresh coastal seafood, and farm-fresh ingredients marinated to perfection.",
    },
    {
      icon: "fa-cart-plus",
      title: "Online Order",
      description: "Fast and easy online ordering with instant M-Pesa push, digital wallet balance, and kitchen tracking.",
    },
    {
      icon: "fa-headset",
      title: "24/7 Service",
      description: "Dedicated reservations desk, customer support, and warm Kenyan hospitality whenever you dine with us.",
    },
  ];

  return (
    <section className="restoran-services-section">
      <div className="restoran-services-grid">
        {services.map((s, idx) => (
          <div key={idx} className="restoran-service-item">
            <i className={`fa ${s.icon} restoran-service-icon`}></i>
            <h5>{s.title}</h5>
            <p>{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
