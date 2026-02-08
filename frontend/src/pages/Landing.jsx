export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <h1>Understand Your Pet, With Data</h1>
        <p>
          Track sleep, activity, and behavior patterns using AI-powered
          video and audio analysis.
        </p>

        <div className="hero-buttons">
          <button className="primary">Get Started</button>
          <button className="secondary">Learn More</button>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>🎥 Camera Analysis</h3>
          <p>Detect sleep, movement, and eating behavior from video.</p>
        </div>

        <div className="feature-card">
          <h3>🎧 Audio Detection</h3>
          <p>Understand vocal stress and excitement patterns.</p>
        </div>

        <div className="feature-card">
          <h3>🧬 Breed Finder</h3>
          <p>Estimate breed percentages using image analysis.</p>
        </div>
      </section>
    </div>
  );
}