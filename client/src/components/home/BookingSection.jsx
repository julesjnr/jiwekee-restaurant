import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function BookingSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const defaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    customer_name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    reservation_date: defaultDate(),
    reservation_time: "19:00",
    guest_count: 2,
    special_requests: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api.bookReservation(formData);
      setSuccessMsg(`Reservation #${res.reservation?.id || "OK"} requested successfully! Confirmation email has been sent.`);
      setFormData({
        customer_name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        reservation_date: defaultDate(),
        reservation_time: "19:00",
        guest_count: 2,
        special_requests: "",
      });
    } catch (err) {
      setErrorMsg(err.message || "Failed to book reservation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="restoran-reservation-section" id="booking">
      <div className="restoran-reservation-card">
        {/* Left Side: Video Preview with /img/video.jpg background */}
        <div className="reservation-video-box">
          <button
            type="button"
            className="btn-play-pulse"
            onClick={() => setIsVideoModalOpen(true)}
            title="Watch Kitchen Craft Video"
            aria-label="Play kitchen video"
          >
            <i className="fa fa-play"></i>
          </button>
        </div>

        {/* Right Side: Booking Form */}
        <div className="reservation-form-box">
          <h5 className="restoran-section-title title-start">Reservation</h5>
          <h2 className="reservation-main-heading">
            Book A Table Online
          </h2>

          {successMsg && (
            <div className="reservation-alert-success">
              ✅ {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="reservation-alert-error">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="reservation-form">
            <div className="form-two-col">
              <div className="form-input-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="e.g. David Kimani"
                />
              </div>

              <div className="form-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. david@example.com"
                />
              </div>
            </div>

            <div className="form-two-col">
              <div className="form-input-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254 700 000 000"
                />
              </div>

              <div className="form-input-group">
                <label>Date & Time *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="date"
                    required
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                    style={{ flex: 1.2 }}
                  />
                  <select
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="21:00">9:00 PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-input-group">
              <label>Number of Guests *</label>
              <select
                value={formData.guest_count}
                onChange={(e) => setFormData({ ...formData, guest_count: Number(e.target.value) })}
              >
                <option value={1}>1 Person</option>
                <option value={2}>2 People (Standard Table)</option>
                <option value={4}>4 People (Family Table)</option>
                <option value={6}>6 People (Dining Booth)</option>
                <option value={8}>8+ People (VIP Terrace Suite)</option>
              </select>
            </div>

            <div className="form-input-group">
              <label>Special Request / Dietary Notes</label>
              <textarea
                rows="2"
                value={formData.special_requests}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                placeholder="Seating preference, birthday celebration, allergies..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-book-nav btn-submit-booking"
            >
              {loading ? "Confirming Table..." : "Book Now"}
            </button>
          </form>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsVideoModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: "720px", padding: "20px", background: "#0F172B", color: "#fff", borderRadius: "16px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, color: "var(--restoran-primary)", fontSize: "18px", fontWeight: "700" }}>
                Jiwekee Kitchen & Grill Craft Story
              </h3>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: "22px", cursor: "pointer" }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "10px" }}>
              <iframe
                title="Kitchen Video"
                src="https://www.youtube.com/embed/DWRcNpR6Kdc?autoplay=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
