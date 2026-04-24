import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen, Download, FileText, Smartphone, Headphones, ExternalLink,
  Sparkles, ScrollText, Eye, Star, Shield, Clock, Layers, Flame,
  BookMarked, Feather, Crown, Quote, ChevronRight, Volume2, MonitorSmartphone
} from "lucide-react";

const tableOfContents = [
  {
    id: "part-1",
    title: "Part One: The Evidence",
    chapters: [
      { name: "Chapter 1: The Rebellion", description: "The 200 Watchers, the Nephilim, forbidden knowledge", anchor: "chapter-1" },
      { name: "Chapter 2: The Corruption", description: "Genetic manipulation and the bloodline war", anchor: "chapter-2" },
      { name: "Chapter 3: The Flood", description: "Why it had to happen, what survived", anchor: "chapter-3" },
      { name: "Chapter 4: The Resets", description: "Tartaria, mud floods, orphan trains", anchor: "chapter-4" },
      { name: "Chapter 5: The Substitution", description: "Yahusha became Jesus, the Name erased", anchor: "chapter-5" },
      { name: "Chapter 6: The Calendar", description: "Time manipulation, Gregorian reform, phantom years", anchor: "chapter-6" },
      { name: "Chapter 7: The Councils", description: "Nicaea, scripture removal, doctrine corruption", anchor: "chapter-7" },
    ]
  },
  {
    id: "part-2",
    title: "Part Two: The Patterns",
    chapters: [
      { name: "Chapter 8-15: The Inversions", description: "Medicine, education, government, religion", anchor: "chapter-8" },
      { name: "Chapter 16-20: The Control Systems", description: "Fear, addiction, technology, media", anchor: "chapter-16" },
      { name: "Chapter 21-25: The Hidden Rulers", description: "Bloodlines, secret societies, the Hydra", anchor: "chapter-21" },
      { name: "Chapter 25C: The Alcatraz-Apollo Deception", description: "Three prisoners vanish, three astronauts appear", anchor: "chapter-25c" },
      { name: "Chapter 25D: The Challenger Deception", description: "Seven astronauts die on live TV — six still walk among us", anchor: "chapter-25d" },
    ]
  },
  {
    id: "part-3",
    title: "Part Three: The Timeline",
    chapters: [
      { name: "Chapter 26-30: The Apostasy", description: "The Great Schism, the falling away", anchor: "chapter-26" },
      { name: "Chapter 31-34: The Missing Millennium", description: "500-1500 AD, the obscured reign", anchor: "chapter-31" },
      { name: "Chapter 35-37: Satan's Little Season", description: "Renaissance to present, the staged rapture", anchor: "chapter-35" },
    ]
  },
  {
    id: "part-4",
    title: "Part Four: The Journey",
    chapters: [
      { name: "Chapter 38: The Fog and The Lifting", description: "Coming out of addiction into clarity", anchor: "chapter-38" },
      { name: "Chapter 39: Fear as the Weapon", description: "How they hijacked survival instinct", anchor: "chapter-39" },
      { name: "Chapter 40: The Mark and The Names", description: "What if the mark isn't a chip?", anchor: "chapter-40" },
      { name: "Chapter 41-44: Why I'm Not Hiding", description: "Personal testimony, the cost of truth", anchor: "chapter-41" },
    ]
  },
  {
    id: "appendices",
    title: "Appendices",
    chapters: [
      { name: "Concordance of Terms", description: "Hebrew words, concepts, definitions", anchor: "concordance" },
      { name: "Scripture Chain References", description: "163+ scripture citations", anchor: "scripture-chain" },
      { name: "Source Documentation", description: "Dead Sea Scrolls, historical records", anchor: "sources" },
    ]
  }
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Veil() {
  const [, setLocation] = useLocation();
  const [isStandalone, setIsStandalone] = useState(false);

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
    if (isIOS) {
      window.open('/api/veil/pdf', '_blank');
      return;
    }
    const a = document.createElement('a');
    a.href = '/api/veil/pdf';
    a.download = 'Through-The-Veil.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadEPUB = () => {
    if (isIOS) {
      window.open('/api/veil/epub', '_blank');
      return;
    }
    const a = document.createElement('a');
    a.href = '/api/veil/epub';
    a.download = 'Through-The-Veil.epub';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    localStorage.setItem('veil-pwa-home', 'true');

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(standalone);

  }, []);

  useEffect(() => {
    document.title = "Through The Veil | The Greatest Story Ever Stole?";
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) manifestLink.href = '/manifest-veil.webmanifest';
    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeColor) themeColor.content = '#a855f7';
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (appleTitle) appleTitle.content = 'Through The Veil';
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleIcon) appleIcon.href = '/icons/veil-192x192.png';
    return () => {
      if (manifestLink) manifestLink.href = '/manifest.webmanifest';
      if (themeColor) themeColor.content = '#00ffff';
      if (appleTitle) appleTitle.content = 'Trust Layer';
      if (appleIcon) appleIcon.href = '/icons/icon-192x192.png';
    };
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ background: "linear-gradient(180deg, #020617, #0c1222, #020617)" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/20 backdrop-blur-sm mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-[0.15em] font-medium">Complete Edition — 2026</span>
            <Flame className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              Through The Veil
            </span>
          </h1>

          <h2 className="text-lg sm:text-xl md:text-2xl text-slate-400 mb-6 sm:mb-8 font-light tracking-wide">
            The Greatest Story Ever Stole?
          </h2>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-purple-500/50" />
            <Feather className="w-4 h-4 text-purple-400/60" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-pink-500/50" />
          </div>

          <p className="text-sm sm:text-base text-slate-300/80 max-w-xl mx-auto mb-3 leading-relaxed">
            A Journey Through Hidden History, Suppressed Truth, and Spiritual Warfare
          </p>
          <p className="text-purple-300 font-semibold text-base sm:text-lg mb-8 sm:mb-10">By Jason Andrews</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button
              onClick={() => handleReadOnline()}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-6 text-base shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all active:scale-[0.98] min-h-[48px]"
              data-testid="button-read-online"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Read Online
            </Button>
            <Button
              onClick={handleDownloadPDF}
              size="lg"
              variant="outline"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50 px-8 py-6 text-base backdrop-blur-sm transition-all active:scale-[0.98] min-h-[48px]"
              data-testid="button-download-pdf-hero"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
          </div>

          {!isStandalone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 max-w-sm mx-auto"
            >
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 backdrop-blur-sm">
                <MonitorSmartphone className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-purple-300 text-sm font-medium">Add to Home Screen</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {isIOS
                      ? 'Tap the share icon (box with arrow) then "Add to Home Screen"'
                      : 'Tap your browser menu (⋮) then "Add to Home Screen"'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16"
        >
          <div className="relative rounded-2xl overflow-hidden aspect-[16/7] sm:aspect-[16/6] max-w-5xl mx-auto">
            <img
              src="/images/veil-hero.jpg"
              alt="Through The Veil"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-pink-900/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
              <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                52 chapters. 163+ scripture references. The complete investigation into hidden history, suppressed truth, and spiritual warfare.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto"
        >
          {[
            { icon: ScrollText, label: "52 Chapters", sub: "Complete Edition", color: "text-purple-400" },
            { icon: Shield, label: "163+ Scriptures", sub: "Cited & Referenced", color: "text-pink-400" },
            { icon: Layers, label: "13 Parts", sub: "Evidence to Journey", color: "text-cyan-400" },
            { icon: Star, label: "107K Words", sub: "Full Investigation", color: "text-purple-400" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <GlassCard glow className="text-center h-full">
                <div className="p-5 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                  <p className="text-white font-bold text-sm sm:text-base">{stat.label}</p>
                  <p className="text-slate-500 text-[10px] sm:text-xs mt-1.5">{stat.sub}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16"
        >
          <div className="text-center mb-8">
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 mb-4 backdrop-blur-sm">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Get Your Copy
            </Badge>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Choose Your Format</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">

            <GlassCard glow className="md:col-span-2 lg:col-span-2 overflow-hidden">
              <div className="relative">
                <img
                  src="/images/veil-manuscript.jpg"
                  alt="Listen to the book"
                  className="w-full h-40 sm:h-48 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,18,36,0.95)] via-[rgba(12,18,36,0.5)] to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/25 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex-shrink-0">
                    <Headphones className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Listen to the Book</h3>
                    <p className="text-sm text-slate-400 mt-0.5">Free Audio with Adobe Reader</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
                  Want to listen instead of read? Adobe Acrobat Reader has a built-in "Read Out Loud" feature that will read the entire book to you — completely free, works offline.
                </p>

                <div className="bg-slate-900/60 rounded-xl p-5 sm:p-6 mb-6 border border-white/5 backdrop-blur-sm">
                  <h4 className="text-white font-semibold mb-4 text-sm sm:text-base flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    How to Listen:
                  </h4>
                  <ol className="space-y-3">
                    {[
                      "Download the PDF and open it in Adobe Acrobat Reader",
                      <>Go to <strong className="text-white">View → Read Out Loud → Activate</strong></>,
                      <>Click <strong className="text-white">"Read This Page"</strong> or <strong className="text-white">"Read To End"</strong></>,
                      "Sit back and listen — works offline on any device!",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-300 flex items-center justify-center text-xs font-bold border border-purple-500/20">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-300 leading-relaxed pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="https://get.adobe.com/reader/" target="_blank" rel="noopener noreferrer" className="flex-1" data-testid="link-adobe-reader">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-5 text-sm sm:text-base min-h-[48px]" data-testid="button-adobe-reader">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get Adobe Reader (Free)
                    </Button>
                  </a>
                  <div className="flex-1">
                    <Button onClick={handleDownloadPDF} variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 py-5 text-sm sm:text-base min-h-[48px]" data-testid="button-download-pdf-listen">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="flex flex-col gap-4 md:gap-6">
              <GlassCard glow className="flex-1 overflow-hidden">
                <div className="relative">
                  <img
                    src="/images/veil-evidence.jpg"
                    alt="PDF Download"
                    className="w-full h-28 sm:h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,18,36,0.95)] via-[rgba(12,18,36,0.4)] to-transparent" />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-cyan-500/20 border border-red-500/30 flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white">PDF Download</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500">Desktop & Print</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-5">
                    {["Complete edition", "163+ scripture refs", "Print-ready format"].map((txt) => (
                      <li key={txt} className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{txt}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleDownloadPDF} className="w-full bg-gradient-to-r from-red-600 to-cyan-600 hover:from-red-500 hover:to-cyan-500 py-5 text-sm min-h-[48px]" data-testid="button-download-pdf-card">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </GlassCard>

              <GlassCard glow className="flex-1 overflow-hidden">
                <div className="relative">
                  <img
                    src="/images/veil-library.jpg"
                    alt="EPUB Download"
                    className="w-full h-28 sm:h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,18,36,0.95)] via-[rgba(12,18,36,0.4)] to-transparent" />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white">EPUB Download</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500">E-readers & Mobile</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-5">
                    {["Complete edition", "Mobile optimized", "Kindle / Kobo / Nook"].map((txt) => (
                      <li key={txt} className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{txt}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleDownloadEPUB} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-5 text-sm min-h-[48px]" data-testid="button-download-epub-card">
                    <Download className="w-4 h-4 mr-2" />
                    Download EPUB
                  </Button>
                </div>
              </GlassCard>
            </div>

          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 sm:mb-16 max-w-5xl mx-auto"
        >
          <GlassCard glow>
            <div className="p-6 sm:p-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 w-fit mb-5">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Read Online</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                Full interactive e-reader with chapter navigation, progress tracking, and AI voice narration. Works on any device.
              </p>
              <Button
                onClick={() => handleReadOnline()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-5 text-sm min-h-[48px]"
                data-testid="button-read-online-card"
              >
                <Eye className="w-4 h-4 mr-2" />
                Open E-Reader
              </Button>
            </div>
          </GlassCard>

          <GlassCard glow>
            <div className="p-6 sm:p-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 w-fit mb-5">
                <Volume2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">AI Voice Narration</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                Nova AI reads each chapter aloud with natural, expressive narration powered by OpenAI. Listen while you commute or relax.
              </p>
              <Button
                onClick={() => handleReadOnline()}
                variant="outline"
                className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 py-5 text-sm min-h-[48px]"
                data-testid="button-ai-voice-card"
              >
                <Headphones className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </div>
          </GlassCard>

          <GlassCard glow className="md:col-span-2 lg:col-span-1">
            <div className="p-6 sm:p-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 w-fit mb-5">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Always Updated</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                The online edition stays current with new research, corrections, and expanded chapters. Version tracking built in.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">v3.0.0 — Latest</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16 max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 mb-4 backdrop-blur-sm">
              <ScrollText className="w-3.5 h-3.5 mr-1.5" />
              Full Table of Contents
            </Badge>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">What's Inside</h3>
          </div>

          <GlassCard glow>
            <div className="p-4 sm:p-6 md:p-8">
            <Accordion type="single" collapsible defaultValue="part-1" className="space-y-2">
              {tableOfContents.map((section) => (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.03] backdrop-blur-xl"
                >
                  <AccordionTrigger
                    className="px-4 sm:px-6 py-4 hover:bg-white/5 text-white font-semibold text-sm sm:text-base [&>svg]:text-purple-400"
                    data-testid={`toc-section-${section.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <BookMarked className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent text-left">
                        {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 sm:px-6 pb-4">
                    <div className="space-y-1">
                      {section.chapters.map((chapter, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleReadOnline(chapter.anchor)}
                          className="w-full flex items-start gap-3 p-3 sm:p-4 text-left hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-transparent transition-all duration-300 rounded-lg group min-h-[44px]"
                          data-testid={`toc-chapter-${chapter.anchor}`}
                        >
                          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-purple-500/40 to-transparent flex-shrink-0 mt-0.5 group-hover:from-purple-400 group-hover:to-pink-400/40 transition-all" />
                          <div className="flex-1 min-w-0">
                            <span className="text-white font-medium text-sm sm:text-base group-hover:text-purple-200 transition-colors block">{chapter.name}</span>
                            <span className="text-slate-500 text-xs sm:text-sm block mt-1 leading-relaxed">{chapter.description}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all" />
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16 max-w-3xl mx-auto"
        >
          <GlassCard glow>
            <div className="p-8 sm:p-10 md:p-14 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
              <div className="absolute top-6 left-8 opacity-10">
                <Quote className="w-12 h-12 text-purple-400" />
              </div>
              <div className="absolute bottom-6 right-8 opacity-10 rotate-180">
                <Quote className="w-12 h-12 text-pink-400" />
              </div>
              <div className="relative z-10">
                <p className="text-base sm:text-lg md:text-xl text-slate-200 leading-relaxed italic mb-6 sm:mb-8">
                  "I do not add to Scripture. I do not take away from it. I simply illuminate what is already written."
                </p>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent to-purple-500/50" />
                  <Feather className="w-4 h-4 text-purple-400/60" />
                  <div className="w-8 h-px bg-gradient-to-l from-transparent to-pink-500/50" />
                </div>
                <p className="text-purple-300 font-semibold">— Jason Andrews</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-8"
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-5">Ready to Begin?</h3>
          <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
            Start reading online, or download your copy in PDF or EPUB format.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button
              onClick={() => handleReadOnline()}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-6 text-base shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all active:scale-[0.98] min-h-[48px]"
              data-testid="button-read-online-bottom"
            >
              <Eye className="w-5 h-5 mr-2" />
              Start Reading
            </Button>
          </div>
        </motion.div>

        <div className="text-center mt-12 pb-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-500/30" />
            <div className="w-1 h-1 rounded-full bg-purple-400/40" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-500/30" />
          </div>
          <p className="text-slate-600 text-sm">
            All glory to Yahuah, the Most High. HalleluYah.
          </p>
        </div>
      </div>
    </div>
  );
}
