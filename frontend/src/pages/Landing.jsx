// src/pages/Landing.jsx
import { useEffect, useState } from "react";
import "./Landing.css";

import logoPng from "../assets/logo.png";
import logoGif from "../assets/logo-gif.gif";
import cameraIcon from "../assets/camera.png";
import audioIcon from "../assets/audio.png";
import magnifyingGlassIcon from "../assets/magnifying-glass.png";
import modelImg from "../assets/model.png";

// ✅ import videos from src/assets
import vid1 from "../assets/vid1.mp4";
import vid2 from "../assets/vid2.mp4";
import vid3 from "../assets/vid3.mp4";
import vid4 from "../assets/vid4.mp4";

// ✅ import avatars from src/assets
import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import avatar3 from "../assets/avatar3.png";
import avatar4 from "../assets/avatar4.png";

function HeroOverlayLogo() {
  const [showGif, setShowGif] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // restart gif by toggling it off then back on
      setShowGif(false);

      setTimeout(() => {
        setShowGif(true);
      }, 50); // tiny delay forces reload
    }, 5000); // every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <img
      key={showGif ? "gif" : "png"}   // forces remount
      className="lp__heroOverlay"
      src={showGif ? logoGif : logoPng}
      alt="PetPulse logo animation"
    />
  );
}


export default function Landing() {
  return (
    <div className="lp">
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

          

            <div className="lp__pills">
              <div className="lp__pill">Video insights</div>
              <div className="lp__pill">Audio detection</div>
              <div className="lp__pill">Breed finder</div>
            </div>
          </div>

          <div className="lp__heroArt">
            <HeroOverlayLogo />
          </div>
        </div>
      </section>

      {/* MODEL VISUAL */}
      <section className="lp__modelSection">
        <img
          src={modelImg}
          alt="PetPulse behavior model visualization"
          className="lp__modelImage"
        />
      </section>

      {/* COMMUNITY PREVIEW */}
      <section className="lp__communitySection">
        <div className="lp__container">
          <h2 className="lp__h2 center">
            Join a community that actually{" "}
            <span className="lp__accent">cares</span>
          </h2>

          <p className="lp__subtitle center">
            Share moments, learn from others, and spot patterns you’d miss alone.
          </p>

          <div className="communityScroller">
            <button
              className="scrollBtn left"
              onClick={() =>
                document.getElementById("communityTrack")?.scrollBy({
                  left: -420,
                  behavior: "smooth",
                })
              }
            >
              ←
            </button>

            <div className="communityTrack" id="communityTrack">
              <div className="communityCard">
                <video src={vid1} muted autoPlay loop playsInline />
                <div className="communityOverlay">
                  <img src={avatar1} className="avatar" alt="" />
                  <span className="username">@chimp56</span>
                  <div className="actions">❤️ 214 💬 32</div>
                </div>
              </div>

              <div className="communityCard">
                <video src={vid2} muted autoPlay loop playsInline />
                <div className="communityOverlay">
                  <img src={avatar2} className="avatar" alt="" />
                  <span className="username">@wen_deasel</span>
                  <div className="actions">❤️ 189 💬 21</div>
                </div>
              </div>

              <div className="communityCard">
                <video src={vid3} muted autoPlay loop playsInline />
                <div className="communityOverlay">
                  <img src={avatar3} className="avatar" alt="" />
                  <span className="username">@azbah</span>
                  <div className="actions">❤️ 302 💬 44</div>
                </div>
              </div>

              <div className="communityCard">
                <video src={vid4} muted autoPlay loop playsInline />
                <div className="communityOverlay">
                  <img src={avatar4} className="avatar" alt="" />
                  <span className="username">@noor.paws</span>
                  <div className="actions">❤️ 167 💬 18</div>
                </div>
              </div>
            </div>

            <button
              className="scrollBtn right"
              onClick={() =>
                document.getElementById("communityTrack")?.scrollBy({
                  left: 420,
                  behavior: "smooth",
                })
              }
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="lp__section lp__softOrange">
        <div className="lp__container">
          <h2 className="lp__h2">Benefits</h2>

          <div className="lp__grid3">
            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={cameraIcon} alt="Camera analysis" />
              </div>
              <h3>Camera Analysis</h3>
              <p>Detect sleep, movement, and routines from video clips.</p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={audioIcon} alt="Audio detection" />
              </div>
              <h3>Audio Detection</h3>
              <p>Spot stress or excitement patterns from sound.</p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={magnifyingGlassIcon} alt="Breed finder" />
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
              <p>No — it flags behavioral trends, not medical diagnoses.</p>
            </div>

            <div className="lp__faqItem">
              <h4>Do I need a wearable?</h4>
              <p>No. The MVP works with video and audio uploads.</p>
            </div>

            <div className="lp__faqItem">
              <h4>What’s tracked?</h4>
              <p>Sleep, activity, wellbeing, and behavior trends.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
