import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

// ─── Table of Contents Data ──────────────────────────────────────────
const tableOfContents = [
  {
    id: "part-1",
    title: "PART ONE — THE REBELLION",
    count: 6,
    chapters: [
      { name: "The Council and the Fall", anchor: "ch-chapter-1-the-council-and-the-fall" },
      { name: "The 200 Watchers Descend", anchor: "ch-chapter-2-the-200-watchers-descend" },
      { name: "The Forbidden Knowledge", anchor: "ch-chapter-3-the-forbidden-knowledge" },
      { name: "The Whole World Remembers", anchor: "ch-chapter-3b-the-whole-world-remembers" },
      { name: "The Nephilim and the Corruption", anchor: "ch-chapter-4-the-nephilim-and-the-corruption" },
      { name: "The Blood Redemption", anchor: "ch-chapter-4b-the-blood-redemption" },
    ]
  },
  {
    id: "part-2",
    title: "PART TWO — THE FIRST RESET",
    count: 4,
    chapters: [
      { name: "The Flood and What It Destroyed", anchor: "ch-chapter-5-the-flood-and-what-it-destroyed" },
      { name: "The Physical Evidence They Ignore", anchor: "ch-chapter-5b-the-physical-evidence-they-ignore" },
      { name: "Dragons, Not Dinosaurs", anchor: "ch-chapter-6-dragons-not-dinosaurs" },
      { name: "The Dog-Headed Beings and Hybrid Remnants", anchor: "ch-chapter-7-the-dog-headed-beings-and-hybrid-remnant" },
    ]
  },
  {
    id: "part-3",
    title: "PART THREE — THE SCATTERING",
    count: 3,
    chapters: [
      { name: "Babel and the Confusion of Tongues", anchor: "ch-chapter-8-babel-and-the-confusion-of-tongues" },
      { name: "The Divine Language Lost", anchor: "ch-chapter-9-the-divine-language-lost" },
      { name: "Spelling as Spellcasting", anchor: "ch-chapter-10-spelling-as-spellcasting" },
    ]
  },
  {
    id: "part-4",
    title: "PART FOUR — THE HIDDEN RULERS",
    count: 4,
    chapters: [
      { name: "Bloodlines and the Thrones of Earth", anchor: "ch-chapter-11-bloodlines-and-the-thrones-of-earth" },
      { name: "The Council of the Cast-Out", anchor: "ch-chapter-12-the-council-of-the-cast-out" },
      { name: "The Nephilim Bloodlines Continue", anchor: "ch-chapter-13-the-nephilim-bloodlines-continue" },
      { name: "Constantine and the Council of Nicaea", anchor: "ch-chapter-13b-constantine-and-the-council-of-nicaea" },
    ]
  },
  {
    id: "part-5",
    title: "PART FIVE — THE GREAT SUBSTITUTION",
    count: 6,
    chapters: [
      { name: "The Name That Was Erased", anchor: "ch-chapter-14-the-name-that-was-erased" },
      { name: "The Name That Was Stolen", anchor: "ch-chapter-15-the-name-that-was-stolen" },
      { name: "The Continuous Deception", anchor: "ch-chapter-15b-the-continuous-deception" },
      { name: "The King James Corruption", anchor: "ch-chapter-16-the-king-james-corruption" },
      { name: "Religious Inversions", anchor: "ch-chapter-17-religious-inversions-what-popular-relig" },
      { name: "The Substituted Calendar", anchor: "ch-chapter-18-the-substituted-calendar" },
    ]
  },
  {
    id: "part-6",
    title: "PART SIX — THE SECOND RESET",
    count: 4,
    chapters: [
      { name: "Tartaria and the Mud Flood", anchor: "ch-chapter-19-tartaria-and-the-mud-flood" },
      { name: "The Petrified Giants", anchor: "ch-chapter-20-the-petrified-giants" },
      { name: "The Orphan Trains and Memory Erasure", anchor: "ch-chapter-21-the-orphan-trains-and-memory-erasure" },
      { name: "The 200 Craters and the 200 Fallen", anchor: "ch-chapter-22-the-200-craters-and-the-200-fallen" },
    ]
  },
  {
    id: "part-7",
    title: "PART SEVEN — THE SYSTEMS OF CONTROL",
    count: 8,
    chapters: [
      { name: "Modern Medicine — The Band-Aid Economy", anchor: "ch-chapter-23-modern-medicine-the-band-aid-economy" },
      { name: "The Indoctrination Machine", anchor: "ch-chapter-24-the-indoctrination-machine" },
      { name: "Economics and the Worker Bees", anchor: "ch-chapter-25-economics-and-the-worker-bees" },
      { name: "False Flags — The Art of Manufactured Crisis", anchor: "ch-chapter-25b-false-flags-the-art-of-manufactured-cr" },
      { name: "The Alcatraz-Apollo Deception", anchor: "ch-chapter-25c-the-alcatraz-apollo-deception" },
      { name: "The Challenger Deception", anchor: "ch-chapter-25d-the-challenger-deception" },
      { name: "The Beast System and the Carousel", anchor: "ch-chapter-26-the-beast-system-and-the-carousel" },
      { name: "The Predators and the Ritual", anchor: "ch-chapter-26b-the-predators-and-the-ritual" },
    ]
  },
  {
    id: "part-8",
    title: "PART EIGHT — THE WAR ON PERCEPTION",
    count: 5,
    chapters: [
      { name: "The Eye Versus the I — The Pineal Gateway", anchor: "ch-chapter-27-the-eye-versus-the-i-the-pineal-gateway" },
      { name: "The Mirror Trap — Vanity and the Deadly Inversion", anchor: "ch-chapter-28-the-mirror-trap-vanity-and-the-deadly-i" },
      { name: "Substances That Steal the Signal", anchor: "ch-chapter-29-substances-that-steal-the-signal" },
      { name: "The Frequency War", anchor: "ch-chapter-30-the-frequency-war" },
      { name: "The Hidden Cosmology", anchor: "ch-chapter-31-the-hidden-cosmology" },
    ]
  },
  {
    id: "part-9",
    title: "PART NINE — THE HOLLOW WORLD",
    count: 2,
    chapters: [
      { name: "The Hollow Souls", anchor: "ch-chapter-32-the-hollow-souls" },
      { name: "UFOs and the Alien Deception", anchor: "ch-chapter-33-ufos-and-the-alien-deception" },
    ]
  },
  {
    id: "part-10",
    title: "PART TEN — THE HIDDEN TIMELINE",
    count: 8,
    chapters: [
      { name: "The Missing Millennium", anchor: "ch-chapter-34-the-missing-millennium" },
      { name: "Daniel, Enoch, and the Seventy Generations", anchor: "ch-chapter-34a-daniel-enoch-and-the-seventy-generatio" },
      { name: "The Resurrections Hidden", anchor: "ch-chapter-34b-the-resurrections-hidden" },
      { name: "The Short Season", anchor: "ch-chapter-35-the-short-season" },
      { name: "The Layers of Deception — Redirect Upon Redirect", anchor: "ch-chapter-36-the-layers-of-deception-redirect-upon-r" },
      { name: "The Revival That Isn't", anchor: "ch-chapter-36b-the-revival-that-isn-t" },
      { name: "The Relocated Map — The Geography of the Lie", anchor: "ch-chapter-36c-the-relocated-map-the-geography-of-the" },
      { name: "The Great Deception Is Here", anchor: "ch-chapter-37-the-great-deception-is-here" },
    ]
  },
  {
    id: "part-11",
    title: "PART ELEVEN — THE AWAKENING",
    count: 4,
    chapters: [
      { name: "The Return of Memory — Reconnection, Not Reincarnation", anchor: "ch-chapter-38-the-return-of-memory-reconnection-not-r" },
      { name: "The Stages of Awakening", anchor: "ch-chapter-39-the-stages-of-awakening" },
      { name: "The Collective Awakening", anchor: "ch-chapter-40-the-collective-awakening" },
      { name: "Love — The Ultimate Corruption", anchor: "ch-chapter-41-love-the-ultimate-corruption" },
    ]
  },
  {
    id: "part-12",
    title: "PART TWELVE — THE RESTORATION",
    count: 7,
    chapters: [
      { name: "The Path Forward", anchor: "ch-chapter-42-the-path-forward" },
      { name: "The Witnesses in Stone and Spirit", anchor: "ch-chapter-43-the-witnesses-in-stone-and-spirit" },
      { name: "The Stolen Way", anchor: "ch-chapter-43b-the-stolen-way" },
      { name: "The Stolen Present Tense", anchor: "ch-chapter-43c-the-stolen-present-tense" },
      { name: "Final Reflections", anchor: "ch-chapter-44-final-reflections" },
      { name: "Words as Seals — Why Signal", anchor: "ch-chapter-45-words-as-seals-why-signal" },
      { name: "The Proof in Their Behavior", anchor: "ch-chapter-46-the-proof-in-their-behavior" },
    ]
  },
  {
    id: "appendices",
    title: "APPENDICES",
    count: 2,
    chapters: [
      { name: "Reference Materials", anchor: "ch-appendix-reference-materials" },
      { name: "About the Cepher Translation", anchor: "ch-appendix-b-about-the-cepher-translation" },
    ]
  }
];


// ─── Scramble Title Effect ───────────────────────────────────────────
const GLYPHS = "ΑΒΓΔΕΖΗΘΙΚΛΜΞΠΣΦΨΩאבגדהוזחטיכלמנסעפצקרשת⟁⟐⟑◆◇▪▫░▒▓";
const TARGET = "INVARIANT";

function ScrambleTitle() {
  const [display, setDisplay] = useState(TARGET);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runScramble = useCallback(() => {
    let iteration = 0;
    const maxIterations = TARGET.length;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplay(
        TARGET.split("")
          .map((char, idx) => {
            if (idx < iteration) return TARGET[idx];
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("")
      );
      iteration += 1 / 3;
      if (iteration >= maxIterations + 1) {
        setDisplay(TARGET);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 40);
  }, []);

  useEffect(() => {
    const timer = setTimeout(runScramble, 600);
    return () => { clearTimeout(timer); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [runScramble]);

  // Re-trigger on scroll back to top
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100) runScramble();
    };
    let ticking = false;
    const throttled = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { handleScroll(); ticking = false; });
      }
    };
    window.addEventListener("scroll", throttled, { passive: true });
    return () => window.removeEventListener("scroll", throttled);
  }, [runScramble]);

  return (
    <h1
      className="invariant-title"
      onMouseEnter={runScramble}
      aria-label="INVARIANT"
    >
      {display}
    </h1>
  );
}

// ─── Ken Burns Hero (CSS-driven) ─────────────────────────────────────
const heroImages = [
  "/images/veil_hero/hero1.jpg",
  "/images/veil_hero/hero2.jpg",
  "/images/veil_hero/hero3.jpg",
  "/images/veil_hero/hero4.jpg",
  "/images/veil_hero/hero5.jpg",
];

function KenBurnsHero() {
  return (
    <>
      {heroImages.map((src, i) => (
        <div
          key={src}
          className="hero-bg"
          style={{
            backgroundImage: `url(${src})`,
            animationDelay: `${i * (24 / heroImages.length)}s`,
            animationDuration: `${heroImages.length * (24 / heroImages.length)}s`,
          }}
        />
      ))}
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function Veil() {
  const [, setLocation] = useLocation();

  // Easter egg PIN modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);
  const pinClickCountRef = useRef(0);
  const pinClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFooterTripleClick = () => {
    pinClickCountRef.current++;
    if (pinClickTimerRef.current) clearTimeout(pinClickTimerRef.current);
    if (pinClickCountRef.current >= 3) {
      pinClickCountRef.current = 0;
      setPinValue('');
      setPinError(false);
      setShowPinModal(true);
    } else {
      pinClickTimerRef.current = setTimeout(() => { pinClickCountRef.current = 0; }, 1500);
    }
  };

  const handleReadOnline = (anchor?: string) => {
    if (anchor) {
      setLocation(`/veil/read#${anchor}`);
      setTimeout(() => { window.location.hash = anchor; }, 100);
    } else {
      setLocation('/veil/read');
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const handleDownloadPDF = () => {
    if (isIOS) { window.open('/api/veil/pdf', '_blank'); return; }
    const a = document.createElement('a');
    a.href = '/api/veil/pdf';
    a.download = 'INVARIANT.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadEPUB = () => {
    if (isIOS) { window.open('/api/veil/epub', '_blank'); return; }
    const a = document.createElement('a');
    a.href = '/api/veil/epub';
    a.download = 'INVARIANT.epub';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // PWA / Meta
  useEffect(() => {
    localStorage.setItem('veil-pwa-home', 'true');
  }, []);

  useEffect(() => {
    document.title = "INVARIANT | What the Lying Pen Could Not Change";
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) manifestLink.href = '/manifest-veil.webmanifest';
    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeColor) themeColor.content = '#050505';
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (appleTitle) appleTitle.content = 'INVARIANT';
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleIcon) appleIcon.href = '/icons/veil-192x192.png';
    return () => {
      if (manifestLink) manifestLink.href = '/manifest.webmanifest';
      if (themeColor) themeColor.content = '#00ffff';
      if (appleTitle) appleTitle.content = 'Trust Layer';
      if (appleIcon) appleIcon.href = '/icons/icon-192x192.png';
    };
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(r => observer.observe(r));
    setTimeout(() => {
      reveals.forEach(r => {
        if (r.getBoundingClientRect().top < window.innerHeight) r.classList.add('active');
      });
    }, 100);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: "71", label: "CHAPTERS" },
    { value: "163+", label: "SCRIPTURE REFS" },
    { value: "13", label: "PARTS" },
    { value: "128K", label: "WORDS" },
  ];

  return (
    <div className="invariant-page">
      {/* Noise overlay */}
      <div className="noise" />

      {/* ═══ HERO ═══ */}
      <section className="hero-sec">
        <KenBurnsHero />
        <div className="hero-overlay" />
        <div className="container reveal">
          <div className="hero-tag">◆&ensp;DARKWAVE STUDIOS LLC</div>
          <ScrambleTitle />
          <h2 className="hero-subtitle">What the Lying Pen Could Not Change</h2>
          <p className="hero-desc">
            A Journey Through Hidden History, Suppressed Truth, and Spiritual Warfare
          </p>
          <p className="hero-author">By Ronald "Jason" Andrews</p>

          <div className="hero-stats">
            {stats.map(s => (
              <div key={s.label} className="stat-block">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="hero-actions">
            <button className="btn-brutal" onClick={() => handleReadOnline()} data-testid="button-read-online">
              READ ONLINE
            </button>
            <button className="btn-brutal" onClick={handleDownloadPDF} data-testid="button-download-pdf-hero">
              DOWNLOAD PDF
            </button>
          </div>
        </div>
      </section>

      {/* ═══ THESIS (inverted white) ═══ */}
      <section className="section section-light">
        <div className="container reveal">
          <h2 className="section-heading">THE INVESTIGATION</h2>
          <p className="thesis-text">
            For centuries, the institutions we trusted to preserve truth have been the very ones altering it. 
            Scribal manipulation, council censorship, calendar fraud, and linguistic sabotage have obscured 
            what was originally given in stone.
          </p>
          <p className="thesis-text" style={{ marginTop: '32px' }}>
            This book does not add to Scripture. It does not take away from it. It illuminates what is already 
            written — by tracing the evidence of corruption back to its source, and by restoring the names, 
            the timelines, and the patterns that were deliberately buried.
          </p>
          <p className="thesis-bold" style={{ marginTop: '32px' }}>
            71 chapters. 128,000 words. Second Edition — 2026.
          </p>
        </div>
      </section>

      {/* ═══ FORMAT CARDS ═══ */}
      <section className="section section-dark" id="formats">
        <div className="container reveal">
          <h2 className="section-heading">CHOOSE YOUR FORMAT</h2>
          <p className="section-sub">Every format. Same truth. Always free.</p>

          <div className="format-grid">
            <button className="format-card" onClick={() => handleReadOnline()} data-testid="button-read-online-card">
              <img src="/images/veil_hero/hero1.jpg" alt="Read Online" className="format-img" loading="lazy" />
              <div className="format-body">
                <div className="format-tag">E-READER</div>
                <h3 className="format-title">Read Online</h3>
                <p className="format-desc">
                  Full interactive e-reader with chapter navigation, progress tracking, and AI voice narration.
                </p>
                <div className="format-cta">OPEN E-READER →</div>
              </div>
            </button>

            <button className="format-card" onClick={handleDownloadPDF} data-testid="button-download-pdf-card">
              <img src="/images/veil_hero/hero3.jpg" alt="PDF Download" className="format-img" loading="lazy" />
              <div className="format-body">
                <div className="format-tag">PDF</div>
                <h3 className="format-title">Download PDF</h3>
                <p className="format-desc">
                  Complete edition, print-ready format. 163+ scripture references. Works with Adobe Read Aloud.
                </p>
                <div className="format-cta">DOWNLOAD →</div>
              </div>
            </button>

            <button className="format-card" onClick={handleDownloadEPUB} data-testid="button-download-epub-card">
              <img src="/images/veil_hero/hero5.jpg" alt="EPUB Download" className="format-img" loading="lazy" />
              <div className="format-body">
                <div className="format-tag">EPUB</div>
                <h3 className="format-title">Download EPUB</h3>
                <p className="format-desc">
                  Mobile-optimized format for Kindle, Kobo, Nook, and Apple Books.
                </p>
                <div className="format-cta">DOWNLOAD →</div>
              </div>
            </button>

            <button className="format-card" onClick={() => handleReadOnline()} data-testid="button-ai-voice-card">
              <img src="/images/veil_hero/hero2.jpg" alt="AI Narration" className="format-img" loading="lazy" />
              <div className="format-body">
                <div className="format-tag">NARRATION</div>
                <h3 className="format-title">AI Voice</h3>
                <p className="format-desc">
                  Nova AI reads each chapter with natural, expressive narration. Listen while you commute.
                </p>
                <div className="format-cta">LISTEN NOW →</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ TABLE OF CONTENTS ═══ */}
      <section className="section section-dark" id="contents">
        <div className="container reveal">
          <h2 className="section-heading">STRUCTURE</h2>
          <p className="section-sub">71 chapters across 13 parts. Evidence to journey.</p>

          <div className="toc-list">
            {tableOfContents.map((part) => (
              <div key={part.id} className="toc-part">
                <div className="toc-part-header">
                  <span className="toc-part-title">{part.title}</span>
                  <span className="toc-part-count">{part.count} CH</span>
                </div>
                <div className="toc-chapters">
                  {part.chapters.map((ch, i) => (
                    <button
                      key={i}
                      className="toc-chapter"
                      onClick={() => handleReadOnline(ch.anchor)}
                      data-testid={`toc-chapter-${ch.anchor}`}
                    >
                      <span className="toc-chapter-name">{ch.name}</span>
                      <span className="toc-chapter-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ QUOTE ═══ */}
      <section className="section section-light">
        <div className="container reveal">
          <blockquote className="pull-quote">
            "I do not add to Scripture. I do not take away from it. I simply illuminate what is already written."
          </blockquote>
          <p className="quote-author">— Jason Andrews</p>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="section section-dark">
        <div className="container reveal" style={{ textAlign: 'center' }}>
          <h2 className="section-heading">BEGIN</h2>
          <p className="section-sub" style={{ marginBottom: '48px' }}>
            Start reading online, or download your copy.
          </p>
          <div className="hero-actions">
            <button className="btn-brutal" onClick={() => handleReadOnline()} data-testid="button-read-online-bottom">
              START READING
            </button>
            <button className="btn-brutal" onClick={handleDownloadPDF} data-testid="button-download-pdf-bottom">
              DOWNLOAD PDF
            </button>
            <button className="btn-brutal" onClick={handleDownloadEPUB} data-testid="button-download-epub-bottom">
              DOWNLOAD EPUB
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="invariant-footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-left">
              <span
                className="footer-logo"
                style={{ cursor: 'default', userSelect: 'none' }}
                onClick={handleFooterTripleClick}
              >INVARIANT</span>
              <span className="footer-sep">|</span>
              <span className="footer-dim">DARKWAVE STUDIOS LLC</span>
            </div>
            <div className="footer-right">
              <span className="footer-dim">© 2026 Ronald "Jason" Andrews</span>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-glory">All glory to Yahuah, the Most High. HalleluYah.</p>
          </div>
        </div>
      </footer>

      {/* Easter Egg PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowPinModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                borderRadius: '4px', padding: '48px', textAlign: 'center', minWidth: '320px',
                background: '#050505', border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.2em', color: '#555', marginBottom: '32px', textTransform: 'uppercase' }}>ACCESS CODE</div>
              <input
                type="password"
                maxLength={6}
                value={pinValue}
                autoFocus
                onChange={(e) => { setPinValue(e.target.value.replace(/\D/g, '')); setPinError(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (pinValue === '042404') {
                      localStorage.setItem('invariant-access', 'granted');
                      setShowPinModal(false);
                      setLocation('/veil/read');
                    } else {
                      setPinError(true);
                      setPinValue('');
                    }
                  }
                }}
                style={{
                  textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', width: '180px',
                  padding: '12px 16px', borderRadius: '2px', outline: 'none', color: '#fff',
                  background: 'rgba(255,255,255,0.03)', fontFamily: 'JetBrains Mono, monospace',
                  border: `1px solid ${pinError ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'border-color 0.3s',
                }}
                placeholder="······"
              />
              <div style={{ marginTop: '16px', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: pinError ? '#f43f5e' : '#333' }}>
                {pinError ? 'INVALID CODE' : 'ENTER 6-DIGIT CODE'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .invariant-page {
          --bg-primary: #050505;
          --bg-secondary: #0a0a0a;
          --bg-tertiary: #111111;
          --text-primary: #FFFFFF;
          --text-secondary: #888888;
          --text-dim: #555555;
          --border: rgba(255, 255, 255, 0.08);
          --border-light: rgba(255, 255, 255, 0.15);
          --font-heading: 'Outfit', sans-serif;
          --font-body: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;

          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body);
          line-height: 1.6;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .invariant-page * { box-sizing: border-box; }

        .noise {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none; z-index: 9999; opacity: 0.04;
          background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');
        }

        .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 10; }
        .section { padding: 140px 0; border-bottom: 1px solid var(--border); position: relative; overflow: hidden; }
        .section-dark { background-color: var(--bg-primary); }
        .section-light { background-color: var(--text-primary); color: var(--bg-primary); }
        .section-light h2, .section-light h3, .section-light h4 { color: var(--bg-primary); }
        .section-light p { color: #333; }

        .section-heading {
          font-family: var(--font-heading); font-weight: 900; text-transform: uppercase;
          font-size: clamp(1.5rem, 4vw, 2.5rem); text-align: center; margin-bottom: 16px;
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .section-sub {
          text-align: center; color: var(--text-secondary); font-size: 1.1rem;
          max-width: 600px; margin: 0 auto 64px;
        }

        /* ═══ REVEAL ═══ */
        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); will-change: opacity, transform; }
        .reveal.active { opacity: 1; transform: translateY(0); }

        /* ═══ HERO ═══ */
        .hero-sec {
          min-height: 100vh; display: flex; align-items: center;
          padding-top: 80px; position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
          background-size: cover; background-position: center; opacity: 0;
          animation: kenburns ${heroImages.length * 4.8}s infinite;
        }
        @keyframes kenburns {
          0% { opacity: 0; transform: scale(1); }
          ${100 / heroImages.length * 0.2}% { opacity: 1; }
          ${100 / heroImages.length * 0.5}% { opacity: 1; }
          ${100 / heroImages.length}% { opacity: 0; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        .hero-overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(5,5,5,0.4), var(--bg-primary));
          z-index: 2;
        }

        .hero-tag {
          font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.2em;
          color: var(--text-dim); text-align: center; margin-bottom: 40px; text-transform: uppercase;
        }

        .invariant-title {
          font-family: var(--font-mono); font-weight: 600;
          font-size: clamp(2.5rem, 8vw, 7rem); line-height: 0.95;
          color: var(--text-primary); text-align: center;
          letter-spacing: 0.15em; cursor: default;
          text-shadow: 0 4px 24px rgba(0,0,0,0.5);
          margin: 0; padding: 0;
        }

        .hero-subtitle {
          font-family: var(--font-body); font-weight: 300;
          font-size: clamp(1rem, 2.5vw, 1.5rem); color: var(--text-secondary);
          text-align: center; margin-top: 24px; letter-spacing: 0.05em;
          text-transform: none;
        }
        .hero-desc {
          font-family: var(--font-body); font-size: clamp(0.85rem, 1.5vw, 1rem);
          color: var(--text-dim); text-align: center; margin-top: 16px; max-width: 600px; margin-left: auto; margin-right: auto;
        }
        .hero-author {
          font-family: var(--font-mono); font-size: 0.8rem; letter-spacing: 0.15em;
          color: var(--text-secondary); text-align: center; margin-top: 24px; text-transform: uppercase;
        }

        .hero-stats {
          display: flex; justify-content: center; gap: 48px; margin-top: 64px;
          flex-wrap: wrap; padding: 32px 0;
        }
        .stat-block { text-align: center; min-width: 100px; }
        .stat-value {
          font-family: var(--font-mono); font-size: 2rem; font-weight: 600;
          color: var(--text-primary); letter-spacing: 0.05em;
        }
        .stat-label {
          font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-dim);
          letter-spacing: 0.2em; margin-top: 8px;
        }

        .hero-actions {
          display: flex; justify-content: center; gap: 24px; margin-top: 48px; flex-wrap: wrap;
        }
        .btn-brutal {
          display: inline-block; background-color: transparent; color: var(--text-primary);
          border: 1px solid rgba(255,255,255,0.2); padding: 16px 48px;
          font-family: var(--font-heading); font-size: 1rem; font-weight: 800;
          text-transform: uppercase; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 2px; letter-spacing: 0.05em;
        }
        .btn-brutal:hover {
          background-color: var(--text-primary); color: var(--bg-primary);
          transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,255,255,0.1);
        }

        /* ═══ THESIS ═══ */
        .thesis-text {
          font-size: clamp(1rem, 2vw, 1.3rem); line-height: 2;
          max-width: 800px; margin: 0 auto; text-align: center;
        }
        .thesis-bold {
          font-size: clamp(1rem, 2vw, 1.15rem); line-height: 2;
          max-width: 800px; margin: 0 auto; text-align: center; font-weight: 600;
        }

        /* ═══ FORMAT CARDS ═══ */
        .format-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 2px;
        }
        .format-card {
          background: var(--bg-secondary); border: 1px solid var(--border);
          text-decoration: none; transition: all 0.3s ease; display: block;
          overflow: hidden; cursor: pointer; text-align: left; padding: 0; width: 100%;
          color: var(--text-primary);
        }
        .format-card:hover {
          border-color: var(--border-light); background: var(--bg-tertiary);
        }
        .format-card:hover .format-img { filter: grayscale(0%) contrast(1.1); }
        .format-card:hover .format-cta { color: var(--text-primary); }
        .format-img {
          width: 100%; height: 180px; object-fit: cover; display: block;
          filter: grayscale(100%) contrast(1.1); transition: filter 0.5s ease;
        }
        .format-body { padding: 24px 28px 28px; }
        .format-tag {
          font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.2em;
          color: var(--text-dim); margin-bottom: 10px;
        }
        .format-title {
          font-family: var(--font-heading); font-weight: 900; font-size: 1.3rem;
          text-transform: uppercase; letter-spacing: -0.02em; margin: 0 0 12px;
        }
        .format-desc {
          font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7; margin: 0;
        }
        .format-cta {
          font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em;
          color: var(--text-dim); margin-top: 20px; text-transform: uppercase;
          transition: color 0.3s;
        }

        /* ═══ TABLE OF CONTENTS ═══ */
        .toc-list { max-width: 800px; margin: 0 auto; }
        .toc-part { border-bottom: 1px solid var(--border); }
        .toc-part:last-child { border-bottom: none; }
        .toc-part-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 0;
        }
        .toc-part-title {
          font-family: var(--font-heading); font-weight: 900; font-size: 1rem;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .toc-part-count {
          font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);
          letter-spacing: 0.15em;
        }
        .toc-chapters { padding-bottom: 16px; }
        .toc-chapter {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; padding: 10px 0 10px 24px; background: none; border: none;
          color: var(--text-secondary); font-family: var(--font-body); font-size: 0.9rem;
          cursor: pointer; transition: color 0.3s; text-align: left;
        }
        .toc-chapter:hover { color: var(--text-primary); }
        .toc-chapter-name { flex: 1; }
        .toc-chapter-arrow {
          font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim);
          opacity: 0; transition: opacity 0.3s;
        }
        .toc-chapter:hover .toc-chapter-arrow { opacity: 1; }

        /* ═══ QUOTE ═══ */
        .pull-quote {
          font-family: var(--font-body); font-size: clamp(1.2rem, 3vw, 1.8rem);
          text-align: center; max-width: 700px; margin: 0 auto; line-height: 1.8;
          font-style: italic; font-weight: 300;
        }
        .quote-author {
          font-family: var(--font-mono); font-size: 0.85rem; text-align: center;
          margin-top: 32px; letter-spacing: 0.1em; font-weight: 600;
        }

        /* ═══ FOOTER ═══ */
        .invariant-footer {
          padding: 48px 0 32px; border-top: 1px solid var(--border); background: var(--bg-primary);
        }
        .footer-inner {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px;
        }
        .footer-left { display: flex; align-items: center; gap: 12px; }
        .footer-logo {
          font-family: var(--font-heading); font-weight: 900; font-size: 1.1rem;
          letter-spacing: 0.1em;
        }
        .footer-sep { color: var(--text-dim); }
        .footer-dim {
          color: var(--text-dim); font-family: var(--font-mono); font-size: 0.7rem;
          letter-spacing: 0.15em;
        }
        .footer-right { display: flex; align-items: center; }
        .footer-bottom {
          margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border);
          text-align: center;
        }
        .footer-glory {
          font-family: var(--font-body); font-size: 0.85rem; color: var(--text-dim);
          font-style: italic;
        }

        /* ═══ MOBILE ═══ */
        @media (max-width: 768px) {
          .section { padding: 80px 0; }
          .hero-stats { gap: 24px; }
          .stat-value { font-size: 1.5rem; }
          .hero-actions { flex-direction: column; align-items: center; }
          .btn-brutal { width: 100%; max-width: 320px; text-align: center; padding: 14px 32px; }
          .format-grid { grid-template-columns: 1fr; }
          .footer-inner { flex-direction: column; text-align: center; }
          .footer-left { flex-direction: column; gap: 8px; }
          .footer-sep { display: none; }
          .section-sub { margin-bottom: 40px; }
          .toc-part-header { padding: 16px 0; }
          .toc-chapter { padding: 8px 0 8px 16px; font-size: 0.85rem; }
        }
      `}</style>
    </div>
  );
}
