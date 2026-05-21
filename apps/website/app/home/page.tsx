import Navbar from '../../components/Navbar';
import HeroSection from '../../components/HeroSection';
import FeedSection from '../../components/FeedSection';
import ReelsSection from '../../components/ReelsSection';
import ExploreSection from '../../components/ExploreSection';
import CreatorSection from '../../components/CreatorSection';
import BusinessSection from '../../components/BusinessSection';
import ContactSection from '../../components/ContactSection';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeedSection />
      <ReelsSection />
      <ExploreSection />
      <CreatorSection />
      <BusinessSection />
      <ContactSection />
    </main>
  );
}
