import logoPng from "../assets/logo.png";
import logoGif from "../assets/logo-gif.gif";
import { useEffect, useState } from "react";
import "./Landing.css";

function HeroOverlayLogo() {
  const [showGif, setShowGif] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowGif(false), 2200); // change to your gif duration (ms)
    return () => clearTimeout(timer);
  }, []);

  return (
    <img
      className="lp__heroOverlay"
      src={showGif ? logoGif : logoPng}
      alt="PetPulse logo animation"
    />
  );
}

export default function Landing() {
  return (
    <div className="lp">
      {/* NAVBAR */}
      <header className="lp__nav">
        <div className="lp__container lp__navInner">
          <div className="lp__brand">
            <img className="lp__logo" src={logoPng} alt="PetPulse logo" />

            <span className="lp__brandName">PetPulse</span>
          </div>

          <nav className="lp__links">
            <a href="#benefits">Benefits</a>
            <a href="#faq">FAQ</a>
            <button className="lp__btn lp__btnGhost">Login</button>
            <button className="lp__btn lp__btnPrimary">Start for free</button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="lp__section">
        <div className="lp__container lp__hero">
          <div>
            <h1 className="lp__title">
              Understand your pet with <span className="lp__accent">data</span>.
            </h1>

            <p className="lp__subtitle">
              Track sleep, activity, and behavior patterns using AI-powered video
              and audio analysis.
            </p>

            <div className="lp__actions">
              <button className="lp__btn lp__btnPrimary">Get Started</button>
              <button className="lp__btn lp__btnGhost">Learn More</button>
            </div>

            <div className="lp__pills">
              <div className="lp__pill">Video insights</div>
              <div className="lp__pill">Audio detection</div>
              <div className="lp__pill">Breed finder</div>
            </div>
          </div>

          {/* HERO MEDIA AREA (base image + overlay GIF) */}
          <div className="lp__heroArt">
                <HeroOverlayLogo />
          </div>

        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="lp__section lp__soft">
        <div className="lp__container">
          <h2 className="lp__h2">Benefits</h2>

          <div className="lp__grid3">
            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src="/logo.png" alt="" />
              </div>
              <h3>Camera Analysis</h3>
              <p>Detect sleep, movement, and routines from video clips.</p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src="/logo.png" alt="" />
              </div>
              <h3>Audio Detection</h3>
              <p>Spot stress or excitement patterns from sound.</p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src="/logo.png" alt="" />
              </div>
              <h3>Breed Finder</h3>
              <p>Estimate breed percentages from an uploaded image.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp__section">
        <div className="lp__container">
          <h2 className="lp__h2">FAQ</h2>

          <div className="lp__faq">
            <div className="lp__faqItem">
              <h4>Does this diagnose health issues?</h4>
              <p>
                No — it flags behavioral trends and changes, not medical diagnoses.
              </p>
            </div>

            <div className="lp__faqItem">
              <h4>Do I need a wearable?</h4>
              <p>Nope. The MVP works with video/audio uploads.</p>
            </div>

            <div className="lp__faqItem">
              <h4>What’s tracked?</h4>
              <p>Sleep/rest time, activity, and audio mood signals.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}