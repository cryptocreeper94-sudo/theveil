# DarkWave Chronicles — Visual Assets & Design Rules Handoff

> **From**: Trust Layer Portal (dwtl.io)
> **To**: Chronicles standalone agent (Vercel deployment)
> **Purpose**: Fix color scheme, replace emojis with photorealistic images, and implement the cinematic hero video carousel.
> **Note**: Jason will provide all image and video files. This document tells you exactly what to expect and how to implement them.

---

## 1. Color Scheme (MANDATORY — Current Build is Wrong)

The current Chronicles standalone build is using incorrect colors. Here is the ONLY acceptable palette:

| Element | Value | Tailwind |
|---------|-------|----------|
| **Background base** | `#06060a` | custom `bg-[#06060a]` |
| **Panel backgrounds** | `#0a0b10` | custom `bg-[#0a0b10]` |
| **Borders** | `#1a1b2e` | custom `border-[#1a1b2e]` |
| **Primary accent** | `#06b6d4` | `cyan-500` |
| **Secondary accent** | `#a855f7` | `purple-500` |
| **Text primary** | `#ffffff` / `rgba(255,255,255,0.9)` | `text-white` / `text-white/90` |
| **Text secondary** | `rgba(255,255,255,0.6)` | `text-white/60` |
| **Text muted** | `rgba(255,255,255,0.4)` | `text-white/40` |
| **Gradients** | Cyan-to-purple only | `from-cyan-500 to-purple-500` |
| **Glow effects** | Cyan or purple only | `shadow-cyan-500/20` or `shadow-purple-500/20` |

**NEVER use amber, orange, yellow, green, red, or any warm tones.** Every accent, glow, badge, button, border, and highlight must be cyan, purple, or white. This applies everywhere — nav, cards, buttons, badges, hover states, focus rings, progress bars, charts, icons.

### Glassmorphism Cards

All cards use a glass effect with these properties:
- Background: `rgba(255,255,255,0.05)` or `bg-white/5`
- Border: `1px solid rgba(255,255,255,0.1)` or `border-white/10`
- Backdrop blur: `backdrop-blur-xl`
- Glow on hover: `shadow-lg shadow-cyan-500/10` or `shadow-purple-500/10`
- Padding goes on an inner `<div>`, NOT on the card wrapper itself

---

## 2. Images — Replace All Emojis with Photorealistic Assets

**The current build uses emojis in cards. This is wrong.** Every card, feature section, era showcase, and marketing element must display a photorealistic AI-generated image.

Jason will upload these image files to the project. Place them in `src/assets/images/` (or `public/images/` if using public directory).

### Image File Inventory

| Filename | Where It's Used |
|----------|----------------|
| `fantasy_sci-fi_world_landscape.png` | Main hero poster/fallback, fantasy era card |
| `medieval_fantasy_kingdom.png` | Medieval era card, admin page, demo page, dashboard |
| `ancient_wisdom_library_interior.png` | Library/knowledge feature card |
| `historical_time_vortex_portal.png` | Time travel / dynamic events feature card |
| `cyberpunk_neon_city.png` | Cyberpunk era card |
| `fantasy_character_heroes.png` | Character creation feature card, community page |
| `fantasy_lands_and_realms.png` | World exploration feature card |
| `stone_age_village_scene.png` | Stone Age / Prehistoric era card |
| `industrial_steampunk_city.png` | Industrial / Steampunk era card |
| `ancient_egyptian_kingdom_sunset.png` | Ancient Egypt era card |
| `wild_west_frontier_town.png` | Wild West era card |
| `victorian_london_street_scene.png` | Victorian London era card |
| `ancient_greek_athens_parthenon.png` | Ancient Greece era card |
| `viking_longship_fjord_scene.png` | Viking era card |
| `renaissance_florence_italy_scene.png` | Renaissance era card |
| `roman_empire_colosseum_gladiators.png` | Roman Empire era card |
| `feudal_japan_samurai_castle.png` | Feudal Japan era card |
| `quantum_dimension_realm.png` | Quantum/sci-fi era, dashboard, economy page |
| `deep_space_station.png` | Deep space era, creators page, economy page |
| `darkwave_chronicles_hero_banner.png` | Chronicles marketing banner |
| `chronicles_historical_adventure.png` | Chronicles promotional card |

### How to Display Images in Cards

Images should fill the card's image area at full width, never shrunk to icon size:

```tsx
<div className="relative h-48 overflow-hidden rounded-t-xl">
  <img 
    src={medievalKingdom} 
    alt="Medieval Era"
    className="w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-transparent to-transparent" />
</div>
```

Key rules:
- Always `object-cover` to fill the container
- Always add a gradient overlay fading to the background color (`#06060a`) at the bottom
- Images are decorative backdrops, not thumbnails — they should feel cinematic
- Round the top corners to match the card: `rounded-t-xl`

---

## 3. Hero Video Carousel (Landing Page)

The Chronicles landing page must have a full-screen cinematic video carousel as the hero section. This plays flyover videos of the game's historical eras with smooth crossfade transitions.

### Video Files (8 videos, ~145MB total)

Jason will provide these files. Place them in `src/assets/videos/` or `public/videos/`:

| Filename | Label | Size |
|----------|-------|------|
| `fantasy_world_cinematic_flyover.mp4` | Historical Journey | 27MB |
| `wild_west_frontier_town_flyover.mp4` | Wild West | 11MB |
| `ancient_rome_colosseum_glory.mp4` | Ancient Rome | 14MB |
| `medieval_castle_twilight_scene.mp4` | Medieval Era | 14MB |
| `victorian_london_foggy_streets.mp4` | Victorian London | 10MB |
| `ancient_egypt_pyramids_sunset.mp4` | Ancient Egypt | 13MB |
| `prehistoric_dinosaur_jungle_scene.mp4` | Prehistoric | 20MB |
| `biblical_jerusalem_temple_scene.mp4` | Biblical Era | 14MB |

Bonus (9th video, not in carousel yet):
- `medieval_kingdom_establishing_shot.mp4` (24MB)

### Video Array Setup

```typescript
import heroVideo from "./assets/videos/fantasy_world_cinematic_flyover.mp4";
import wildWestVideo from "./assets/videos/wild_west_frontier_town_flyover.mp4";
import ancientRomeVideo from "./assets/videos/ancient_rome_colosseum_glory.mp4";
import medievalCastleVideo from "./assets/videos/medieval_castle_twilight_scene.mp4";
import victorianLondonVideo from "./assets/videos/victorian_london_foggy_streets.mp4";
import ancientEgyptVideo from "./assets/videos/ancient_egypt_pyramids_sunset.mp4";
import prehistoricVideo from "./assets/videos/prehistoric_dinosaur_jungle_scene.mp4";
import biblicalVideo from "./assets/videos/biblical_jerusalem_temple_scene.mp4";

const HERO_VIDEOS = [
  { src: heroVideo, label: "Historical Journey" },
  { src: wildWestVideo, label: "Wild West" },
  { src: ancientRomeVideo, label: "Ancient Rome" },
  { src: medievalCastleVideo, label: "Medieval Era" },
  { src: victorianLondonVideo, label: "Victorian London" },
  { src: ancientEgyptVideo, label: "Ancient Egypt" },
  { src: prehistoricVideo, label: "Prehistoric" },
  { src: biblicalVideo, label: "Biblical Era" },
];
```

### How It Works

The hero uses two stacked `<video>` elements — one playing, one preloading the next. When the current video ends, they crossfade via opacity transitions.

**Key behaviors:**
1. **Auto-advances** — when the current video ends, crossfade (700ms) to the next video
2. **Starts muted** — `videoMuted` defaults to `true`; toggle button in top-right corner
3. **Audio fade** — volume fades smoothly over 500ms (20 incremental steps) on transitions
4. **Preloading** — the next video has `preload="auto"` and calls `.load()` when queued
5. **Indicator dots** — bottom-center, pill-shaped. Active = wide white pill, inactive = small dot. Hidden on mobile (`hidden sm:flex`)
6. **Click to jump** — clicking any dot triggers crossfade to that video
7. **Two gradient overlays** over the video for readability
8. **Atmospheric radial glow** — purple at 20% from left, cyan at 80% from left

### React State & Refs

```typescript
const [videoMuted, setVideoMuted] = useState(true);
const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
const [nextVideoIndex, setNextVideoIndex] = useState(1);
const [isVideoTransitioning, setIsVideoTransitioning] = useState(false);
const currentVideoRef = useRef<HTMLVideoElement>(null);
const nextVideoRef = useRef<HTMLVideoElement>(null);
```

### Audio Fade Function

```typescript
const fadeAudio = (video: HTMLVideoElement, fadeIn: boolean, duration: number = 500) => {
  const steps = 20;
  const stepTime = duration / steps;
  const startVolume = fadeIn ? 0 : 1;
  const endVolume = fadeIn ? 1 : 0;
  const volumeStep = (endVolume - startVolume) / steps;
  video.volume = startVolume;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    video.volume = Math.max(0, Math.min(1, startVolume + (volumeStep * step)));
    if (step >= steps) {
      clearInterval(interval);
      video.volume = endVolume;
    }
  }, stepTime);
};
```

### Video End Handler (useEffect)

```typescript
useEffect(() => {
  const handleVideoEnd = () => {
    const currentVideo = currentVideoRef.current;
    if (currentVideo && !videoMuted) {
      fadeAudio(currentVideo, false, 500);
    }
    setIsVideoTransitioning(true);
    setTimeout(() => {
      setCurrentVideoIndex(nextVideoIndex);
      setNextVideoIndex((nextVideoIndex + 1) % HERO_VIDEOS.length);
      setIsVideoTransitioning(false);
    }, 400);
  };
  const video = currentVideoRef.current;
  if (video) {
    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }
}, [nextVideoIndex, videoMuted]);
```

### Preload & Playback (useEffects)

```typescript
useEffect(() => {
  if (nextVideoRef.current) {
    nextVideoRef.current.load();
  }
}, [nextVideoIndex]);

useEffect(() => {
  if (currentVideoRef.current && !isVideoTransitioning) {
    const video = currentVideoRef.current;
    video.volume = 0;
    video.play().catch(() => {});
    if (!videoMuted) {
      fadeAudio(video, true, 500);
    }
  }
}, [currentVideoIndex, isVideoTransitioning, videoMuted]);
```

### Full Hero Section JSX

```tsx
<section className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden">
  <div className="absolute inset-0 bg-black">
    {/* Current video */}
    <video
      ref={currentVideoRef}
      key={`current-${currentVideoIndex}`}
      autoPlay
      muted={videoMuted}
      playsInline
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
        isVideoTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <source src={HERO_VIDEOS[currentVideoIndex].src} type="video/mp4" />
    </video>
    {/* Next video (preloaded, hidden until transition) */}
    <video
      ref={nextVideoRef}
      key={`next-${nextVideoIndex}`}
      muted={videoMuted}
      playsInline
      preload="auto"
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
        isVideoTransitioning ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <source src={HERO_VIDEOS[nextVideoIndex].src} type="video/mp4" />
    </video>
    {/* Gradient overlays for text readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#06060a]" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
  </div>

  {/* Atmospheric cyan/purple glow */}
  <div className="absolute inset-0 opacity-40 pointer-events-none"
    style={{
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(168,85,247,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6,182,212,0.4) 0%, transparent 50%)',
    }}
  />

  {/* Video indicator dots — hidden on small mobile */}
  <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
    {HERO_VIDEOS.map((video, idx) => (
      <button
        key={idx}
        onClick={() => {
          if (idx !== currentVideoIndex) {
            setNextVideoIndex(idx);
            setIsVideoTransitioning(true);
            setTimeout(() => {
              setCurrentVideoIndex(idx);
              setNextVideoIndex((idx + 1) % HERO_VIDEOS.length);
              setIsVideoTransitioning(false);
            }, 700);
          }
        }}
        className={`transition-all ${currentVideoIndex === idx
          ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white rounded-full'
          : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/60 rounded-full'}`}
        title={video.label}
        data-testid={`button-video-${idx}`}
      />
    ))}
  </div>

  {/* Mute/unmute toggle */}
  <button
    onClick={() => setVideoMuted(!videoMuted)}
    className="absolute top-20 right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
    data-testid="button-toggle-sound"
  >
    {videoMuted
      ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
      : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
  </button>

  {/* Your hero text content goes here, centered over the video */}
  <div className="relative z-10 container mx-auto px-4 text-center">
    {/* Title, subtitle, CTA buttons */}
  </div>
</section>
```

### Required Imports for Icons

```typescript
import { VolumeX, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
```

---

## 4. Summary Checklist

- [ ] Fix background to `#06060a` everywhere (not gray, not blue-black, not any other dark)
- [ ] Fix all accents to cyan (`#06b6d4`) and purple (`#a855f7`) only
- [ ] Remove ALL amber, orange, yellow, green, red tones from the entire app
- [ ] Remove ALL emojis from cards — replace with photorealistic image imports
- [ ] Add glassmorphism (`bg-white/5 backdrop-blur-xl border-white/10`) to all cards
- [ ] Add gradient overlay on all card images fading to `#06060a`
- [ ] Implement hero video carousel on the landing page using the code above
- [ ] Wait for Jason to upload the video and image files, then import them
- [ ] Test video autoplay, crossfade transitions, mute/unmute, and indicator dots
- [ ] Verify all text is white/white-alpha — no colored text except cyan/purple accents

---

*Source: Trust Layer Portal (dwtl.io) — Chronicles Visual Assets Handoff*
*Last Updated: March 2026*
