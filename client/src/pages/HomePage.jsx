import Hero from "../components/home/Hero";
import Services from "../components/home/Services";
import About from "../components/home/About";
import MenuSection from "../components/home/MenuSection";
import Stats from "../components/home/Stats";
import BookingSection from "../components/home/BookingSection";
import Team from "../components/home/Team";
import Testimonials from "../components/home/Testimonials";

export default function HomePage() {
  return (
    <main className="restoran-landing-page">
      {/* 1. Hero Section with background overlay & rotating plate */}
      <Hero />

      {/* 2. Services Feature Highlights with icons */}
      <Services />

      {/* 3. About Us with 4-image collage and experience counter */}
      <About />

      {/* 4. Popular Food Menu with database items and category tabs */}
      <MenuSection />

      {/* 5. Live Statistics & Counter Metrics */}
      <Stats />

      {/* 6. Online Table Reservation Desk & Kitchen Video Story */}
      <BookingSection />

      {/* 7. Master Chefs Team */}
      <Team />

      {/* 8. Client Testimonials and Star Ratings */}
      <Testimonials />
    </main>
  );
}
