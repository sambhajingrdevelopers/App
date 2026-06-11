import { features } from '../data/websiteData';

export default function BusinessSection() {
  return (
    <>
      <section id="features" className="section">
        <div className="sectionHead">
          <span>Platform Features</span>
          <h2>Complete product scope for a real social media system</h2>
        </div>

        <div className="featureGrid">
          {features.map(([title, text]) => (
            <div className="featureCard" key={title}>
              <div>✦</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="business" className="section businessSection">
        <div className="businessBox">
          <div>
            <span className="badge">Business Ready</span>
            <h2>Built for growth, monetization and admin control</h2>
            <p>
              Future modules can include creator wallet, paid reels, promoted
              posts, subscriptions, verification requests, ad manager, reports
              and business analytics.
            </p>
          </div>

          <div className="revenueCard">
            <span>Creator Revenue</span>
            <strong>₹48,920</strong>
            <p>Estimated monthly creator earnings</p>
            <div className="progress"><span /></div>
          </div>
        </div>
      </section>
    </>
  );
}
