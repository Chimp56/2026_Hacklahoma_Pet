// src/pages/Landing.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Landing.css";

// Images / icons (src/assets)
import logoPng from "../assets/logo.png";
import logoGif from "../assets/logo-gif.gif";
import cameraIcon from "../assets/camera.png";
import audioIcon from "../assets/audio.png";
import magnifyingGlassIcon from "../assets/magnifying-glass.png";
import modelImg from "../assets/model.png";

// Videos (src/assets)
import vid1 from "../assets/vid1.mp4";
import vid2 from "../assets/vid2.mp4";
import vid3 from "../assets/vid3.mp4";
import vid4 from "../assets/vid4.mp4";

// Avatars (src/assets)
import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import avatar3 from "../assets/avatar3.png";
import avatar4 from "../assets/avatar4.png";

function HeroOverlayLogo() {
  const [showGif, setShowGif] = useState(true);

  useEffect(() => {
    // Loop: GIF plays, then PNG, then restart every 5s (change if you want)
    const interval = setInterval(() => {
      setShowGif(false);
      setTimeout(() => setShowGif(true), 60); // forces reload
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <img
      key={showGif ? "gif" : "png"} // remount = restart gif
      className="lp__heroOverlay"
      src={showGif ? logoGif : logoPng}
      alt="Logo animation"
      draggable="false"
    />
  );
}

// Text Flip Component — rotating word inline so "[Word] your pet with data" flows with no extra gap
function TextFlip({ words }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span style={{ display: "inline-block", verticalAlign: "bottom" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ display: "inline-block" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Landing() {
  const trackRef = useRef(null);
  const words = ["Understand", "Love", "Support"];

  const communityCards = useMemo(
    () => [
      { vid: vid1, avatar: avatar4, user: "@lee", likes: 214, comments: 32 },
      { vid: vid2, avatar: avatar2, user: "@wen_deasel", likes: 189, comments: 21 },
      { vid: vid3, avatar: avatar3, user: "@azbah", likes: 302, comments: 44 },
      { vid: vid4, avatar: avatar1, user: "@Chimp56", likes: 167, comments: 18 },
    ],
    []
  );

  const scrollTrack = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  return (
    <div className="lp">
      {/* HERO */}
      <section className="lp__section">
        <div className="lp__container lp__hero">
          <div className="lp__heroLeft">
            <motion.h1
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="lp__title"
            >
              <TextFlip words={words} /> your pet with{" "}
              <span className="lp__accent">data</span>.
            </motion.h1>

            <p className="lp__subtitle">
              Track sleep, activity, and behavior using AI-powered video + audio analysis.
            </p>

            <div className="lp__pills">
              <div className="lp__pill">Video insights</div>
              <div className="lp__pill">Audio detection</div>
              <div className="lp__pill">Breed finder</div>
            </div>
          </div>

          <div className="lp__heroArt" aria-hidden="true">
            <HeroOverlayLogo />
          </div>
        </div>
      </section>

      {/* MODEL VISUAL */}
      <section className="lp__modelSection">
        <img
          src={modelImg}
          alt="Behavior model visualization"
          className="lp__modelImage"
          draggable="false"
        />
      </section>

      {/* COMMUNITY PREVIEW */}
      <section className="lp__communitySection">
        <div className="lp__container">
          <h2 className="lp__h2 center">
            Join a community that actually <span className="lp__accent">cares</span>
          </h2>

          <p className="lp__subtitle center">
            Share moments, learn from others, and understand your pet better.
          </p>

          <div className="communityScroller">
            <button
              type="button"
              className="scrollBtn left"
              onClick={() => scrollTrack(-1)}
              aria-label="Scroll left"
            >
              ←
            </button>

            <div className="communityTrack" ref={trackRef}>
              {communityCards.map((c, idx) => (
                <div className="communityCard" key={idx}>
                  <video src={c.vid} muted autoPlay loop playsInline preload="metadata" />
                  <div className="communityOverlay">
                    <img src={c.avatar} className="avatar" alt="" draggable="false" />
                    <span className="username">{c.user}</span>
                    <div className="actions">
                      ❤️ {c.likes} &nbsp;&nbsp; 💬 {c.comments}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="scrollBtn right"
              onClick={() => scrollTrack(1)}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="lp__section lp__softPurple">
        <div className="lp__container">
          <h2 className="lp__h2">Benefits</h2>

          <div className="lp__grid3">
            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={cameraIcon} alt="Camera analysis" />
              </div>
              <h3>Camera Analysis</h3>
              <p>
                Detect activity, rest, and routines from short clips — summarized clearly.
              </p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={audioIcon} alt="Audio detection" />
              </div>
              <h3>Audio Detection</h3>
              <p>
                Flag stress/excitement signals from audio and track changes over time.
              </p>
            </div>

            <div className="lp__card">
              <div className="lp__cardIcon">
                <img src={magnifyingGlassIcon} alt="Breed finder" />
              </div>
              <h3>Breed Finder</h3>
              <p>Estimate likely breeds from an uploaded photo (quick + simple).</p>
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
              <p>No — it highlights behavioral changes and trends, not diagnoses.</p>
            </div>

            <div className="lp__faqItem">
              <h4>Is my data private?</h4>
              <p>
                Yes. Uploads are processed securely and only shared if you choose to post.
              </p>
            </div>

            <div className="lp__faqItem">
              <h4>Who is this for?</h4>
              <p>Pet owners who want a clearer read on habits, routines, and wellbeing.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
