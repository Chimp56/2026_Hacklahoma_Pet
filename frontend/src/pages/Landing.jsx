import "./Landing.css";
import logo from "../assets/logo.png";

export default function Landing() {
  return (
    <div className="lp">
      {/* Top Nav */}
      <header className="lp__nav">
        <div className="lp__container lp__navInner">
          <div className="lp__brand">
            <img className="lp__logo" src={logo} alt="Logo" />
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

      {/* Hero */}
      <section className="lp__section">
        <div className="lp__container lp__hero">
          <div className="lp__heroLeft">
            <h1 className="lp__title">
              Understand your pet with <span className="lp__accent">AI</span> insights.
            </h1>

            <p className="lp__subtitle">
              Upload video or audio and get clean summaries for sleep, activity,
              and behavior trends — fast and simple.
            </p>

            <div className="lp__actions">
              <button className="lp__btn lp__btnPrimary">Get Started</button>
              <button className="lp__btn lp__btnGhost">See Demo</button>
            </div>

            <div className="lp__pills">
              <div className="lp__pill">100% camera/audio</div>
              <div className="lp__pill">No wearables</div>
              <div className="lp__pill">Trend tracking</div>
            </div>
          </div>

          {/* Filler image using your logo for now */}
          <div className="lp__heroRight">
            <div className="lp__heroArt">
              <img className="lp__heroImg" src={logo} alt="Hero art" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="lp__section lp__soft">
        <div className="lp__container">
          <h2 className="lp__h2">Benefits</h2>

          <div className="lp__grid3">
            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={logo} alt="" />
              </div>
              <h3>Clear summaries</h3>
              <p>Get simple results + confidence scores you can trust.</p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={logo} alt="" />
              </div>
              <h3>Fast analysis</h3>
              <p>Upload a clip and get insights without the mess.</p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={logo} alt="" />
              </div>
              <h3>Community</h3>
              <p>Compare trends with similar pets (anonymously).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer-ish */}
      <section id="faq" className="lp__section">
        <div className="lp__container">
          <h2 className="lp__h2">FAQ</h2>
          <div className="lp__faq">
            <div className="lp__faqItem">
              <h4>Is this a medical tool?</h4>
              <p>No — it detects behavior changes and trends, not diagnoses.</p>
            </div>
            <div className="lp__faqItem">
              <h4>Do I need a wearable?</h4>
              <p>Nope. Video/audio is enough for the demo and MVP.</p>
            </div>
            <div className="lp__faqItem">
              <h4>What can it track?</h4>
              <p>Sleep/rest patterns, activity, and audio mood signals.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
