type LocationProfile = {
  name: string;
  emoji: string;
  generators: SoundGenerator[];
};

type SoundGenerator = {
  id: string;
  type: "noise" | "tone" | "crackle" | "rhythm" | "chirp" | "rumble" | "chime";
  volume: number;
  params?: Record<string, number>;
};

type EraProfiles = Record<string, LocationProfile>;

function createNoiseBuffer(ctx: AudioContext, duration: number, type: "white" | "pink" | "brown" = "white"): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (type === "white") {
      data[i] = white;
    } else if (type === "pink") {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      b0 = (b0 + (0.02 * white)) / 1.02;
      data[i] = b0 * 3.5;
    }
  }
  return buffer;
}

type ActiveGenerator = {
  gainNode: GainNode;
  nodes: AudioNode[];
  targetVolume: number;
  intervals: ReturnType<typeof setInterval>[];
};

const MEDIEVAL_PROFILES: EraProfiles = {
  home: {
    name: "Your Dwelling",
    emoji: "🏠",
    generators: [
      { id: "fire", type: "crackle", volume: 0.35, params: { rate: 8, tone: 800 } },
      { id: "wind_low", type: "noise", volume: 0.06, params: { filter: 200, q: 0.5 } },
      { id: "crickets", type: "chirp", volume: 0.08, params: { freq: 4000, rate: 6, chirpLen: 0.05 } },
    ],
  },
  tavern: {
    name: "The Tavern",
    emoji: "🍺",
    generators: [
      { id: "crowd", type: "noise", volume: 0.18, params: { filter: 1200, q: 1.5 } },
      { id: "fire", type: "crackle", volume: 0.15, params: { rate: 6, tone: 700 } },
      { id: "murmur", type: "rumble", volume: 0.12, params: { freq: 180, wobble: 3 } },
      { id: "clinks", type: "chime", volume: 0.06, params: { freq: 3000, rate: 0.5 } },
    ],
  },
  town: {
    name: "Town Square",
    emoji: "🏘️",
    generators: [
      { id: "crowd", type: "noise", volume: 0.1, params: { filter: 1500, q: 1 } },
      { id: "birds", type: "chirp", volume: 0.12, params: { freq: 3200, rate: 3, chirpLen: 0.15 } },
      { id: "wind", type: "noise", volume: 0.05, params: { filter: 300, q: 0.3 } },
    ],
  },
  church: {
    name: "The Chapel",
    emoji: "⛪",
    generators: [
      { id: "bell", type: "chime", volume: 0.08, params: { freq: 800, rate: 0.15 } },
      { id: "reverb_air", type: "noise", volume: 0.04, params: { filter: 400, q: 0.2 } },
      { id: "deep_tone", type: "tone", volume: 0.06, params: { freq: 130, type: 1 } },
    ],
  },
  forest: {
    name: "The Forest",
    emoji: "🌲",
    generators: [
      { id: "birds", type: "chirp", volume: 0.15, params: { freq: 2800, rate: 4, chirpLen: 0.2 } },
      { id: "wind", type: "noise", volume: 0.1, params: { filter: 250, q: 0.4 } },
      { id: "leaves", type: "noise", volume: 0.06, params: { filter: 3000, q: 2 } },
      { id: "stream", type: "noise", volume: 0.08, params: { filter: 5000, q: 3 } },
    ],
  },
  marketplace: {
    name: "Marketplace",
    emoji: "🏪",
    generators: [
      { id: "crowd", type: "noise", volume: 0.2, params: { filter: 1400, q: 1.2 } },
      { id: "hammering", type: "rhythm", volume: 0.08, params: { freq: 200, rate: 2, decay: 0.08 } },
      { id: "chatter", type: "rumble", volume: 0.1, params: { freq: 250, wobble: 5 } },
    ],
  },
  workplace: {
    name: "Your Workshop",
    emoji: "🔨",
    generators: [
      { id: "hammering", type: "rhythm", volume: 0.12, params: { freq: 180, rate: 1.5, decay: 0.1 } },
      { id: "fire", type: "crackle", volume: 0.2, params: { rate: 10, tone: 600 } },
      { id: "wind_distant", type: "noise", volume: 0.03, params: { filter: 200, q: 0.3 } },
    ],
  },
};

const WILDWEST_PROFILES: EraProfiles = {
  home: {
    name: "Your Cabin",
    emoji: "🏚️",
    generators: [
      { id: "fire", type: "crackle", volume: 0.3, params: { rate: 7, tone: 750 } },
      { id: "wind", type: "noise", volume: 0.15, params: { filter: 180, q: 0.4 } },
      { id: "crickets", type: "chirp", volume: 0.1, params: { freq: 3800, rate: 5, chirpLen: 0.04 } },
    ],
  },
  tavern: {
    name: "The Saloon",
    emoji: "🥃",
    generators: [
      { id: "crowd", type: "noise", volume: 0.2, params: { filter: 1100, q: 1.3 } },
      { id: "piano", type: "chime", volume: 0.1, params: { freq: 1200, rate: 3 } },
      { id: "murmur", type: "rumble", volume: 0.1, params: { freq: 200, wobble: 4 } },
      { id: "glass", type: "chime", volume: 0.04, params: { freq: 4000, rate: 0.3 } },
    ],
  },
  town: {
    name: "Main Street",
    emoji: "🏜️",
    generators: [
      { id: "wind", type: "noise", volume: 0.2, params: { filter: 200, q: 0.5 } },
      { id: "dust", type: "noise", volume: 0.05, params: { filter: 4000, q: 1 } },
      { id: "distant_crowd", type: "noise", volume: 0.06, params: { filter: 800, q: 0.8 } },
    ],
  },
  church: {
    name: "The Church",
    emoji: "⛪",
    generators: [
      { id: "bell", type: "chime", volume: 0.07, params: { freq: 700, rate: 0.12 } },
      { id: "wind", type: "noise", volume: 0.06, params: { filter: 250, q: 0.3 } },
    ],
  },
  forest: {
    name: "The Wilderness",
    emoji: "🌵",
    generators: [
      { id: "wind", type: "noise", volume: 0.25, params: { filter: 220, q: 0.5 } },
      { id: "birds", type: "chirp", volume: 0.08, params: { freq: 2500, rate: 2, chirpLen: 0.25 } },
      { id: "crickets", type: "chirp", volume: 0.06, params: { freq: 4200, rate: 4, chirpLen: 0.03 } },
    ],
  },
  marketplace: {
    name: "General Store",
    emoji: "🏪",
    generators: [
      { id: "crowd", type: "noise", volume: 0.15, params: { filter: 1200, q: 1 } },
      { id: "wind", type: "noise", volume: 0.1, params: { filter: 250, q: 0.4 } },
      { id: "horses", type: "rumble", volume: 0.06, params: { freq: 40, wobble: 0.5 } },
    ],
  },
  workplace: {
    name: "Your Post",
    emoji: "⛏️",
    generators: [
      { id: "hammering", type: "rhythm", volume: 0.1, params: { freq: 150, rate: 1, decay: 0.12 } },
      { id: "wind", type: "noise", volume: 0.12, params: { filter: 200, q: 0.4 } },
    ],
  },
};

const MODERN_PROFILES: EraProfiles = {
  home: {
    name: "Your Apartment",
    emoji: "🏢",
    generators: [
      { id: "city_hum", type: "rumble", volume: 0.06, params: { freq: 60, wobble: 0.5 } },
      { id: "rain", type: "noise", volume: 0.12, params: { filter: 6000, q: 0.5 } },
      { id: "appliance", type: "tone", volume: 0.02, params: { freq: 120, type: 0 } },
    ],
  },
  tavern: {
    name: "The Bar",
    emoji: "🍸",
    generators: [
      { id: "crowd", type: "noise", volume: 0.22, params: { filter: 1300, q: 1.5 } },
      { id: "music_bass", type: "rumble", volume: 0.15, params: { freq: 80, wobble: 2 } },
      { id: "glass", type: "chime", volume: 0.05, params: { freq: 3500, rate: 0.4 } },
    ],
  },
  town: {
    name: "Downtown",
    emoji: "🌆",
    generators: [
      { id: "traffic", type: "noise", volume: 0.15, params: { filter: 400, q: 0.8 } },
      { id: "crowd", type: "noise", volume: 0.08, params: { filter: 1500, q: 1 } },
      { id: "city_hum", type: "rumble", volume: 0.06, params: { freq: 55, wobble: 1 } },
    ],
  },
  workplace: {
    name: "The Office",
    emoji: "💻",
    generators: [
      { id: "typing", type: "rhythm", volume: 0.04, params: { freq: 3000, rate: 8, decay: 0.02 } },
      { id: "hvac", type: "noise", volume: 0.06, params: { filter: 300, q: 0.3 } },
      { id: "hum", type: "tone", volume: 0.02, params: { freq: 100, type: 0 } },
    ],
  },
  church: {
    name: "Community Center",
    emoji: "🏛️",
    generators: [
      { id: "echo", type: "noise", volume: 0.03, params: { filter: 350, q: 0.2 } },
      { id: "hum", type: "tone", volume: 0.02, params: { freq: 110, type: 1 } },
    ],
  },
  marketplace: {
    name: "Shopping District",
    emoji: "🛍️",
    generators: [
      { id: "crowd", type: "noise", volume: 0.2, params: { filter: 1500, q: 1.2 } },
      { id: "city", type: "rumble", volume: 0.08, params: { freq: 50, wobble: 1 } },
      { id: "chimes", type: "chime", volume: 0.04, params: { freq: 2500, rate: 0.3 } },
    ],
  },
  forest: {
    name: "The Park",
    emoji: "🌳",
    generators: [
      { id: "birds", type: "chirp", volume: 0.18, params: { freq: 3000, rate: 3.5, chirpLen: 0.18 } },
      { id: "wind", type: "noise", volume: 0.08, params: { filter: 280, q: 0.4 } },
      { id: "fountain", type: "noise", volume: 0.1, params: { filter: 4500, q: 2.5 } },
    ],
  },
};

const ERA_SOUND_PROFILES: Record<string, EraProfiles> = {
  medieval: MEDIEVAL_PROFILES,
  wildwest: WILDWEST_PROFILES,
  modern: MODERN_PROFILES,
};

function applyNightModifiers(generators: SoundGenerator[]): SoundGenerator[] {
  return generators.map((g) => {
    if (g.id.includes("bird") || g.id.includes("crowd") || g.id.includes("market") || g.id.includes("chatter")) {
      return { ...g, volume: g.volume * 0.15 };
    }
    if (g.id.includes("cricket")) {
      return { ...g, volume: Math.min(g.volume * 2.5, 0.25) };
    }
    if (g.id.includes("wind")) {
      return { ...g, volume: Math.min(g.volume * 1.4, 0.25) };
    }
    if (g.id.includes("fire") || g.type === "crackle") {
      return { ...g, volume: Math.min(g.volume * 1.3, 0.4) };
    }
    return g;
  });
}

export type AmbientAudioState = {
  isPlaying: boolean;
  isMuted: boolean;
  masterVolume: number;
  currentLocation: string;
  currentEra: string;
  locationName: string;
  locationEmoji: string;
  layerCount: number;
  isNight: boolean;
};

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeGenerators: Map<string, ActiveGenerator> = new Map();
  private masterVolume: number = 0.5;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private currentLocation: string = "";
  private currentEra: string = "";
  private isNight: boolean = false;
  private onStateChange?: (state: AmbientAudioState) => void;

  constructor(onStateChange?: (state: AmbientAudioState) => void) {
    this.onStateChange = onStateChange;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private emitState() {
    const profile = this.getProfile();
    this.onStateChange?.({
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      currentLocation: this.currentLocation,
      currentEra: this.currentEra,
      locationName: profile?.name || "Unknown",
      locationEmoji: profile?.emoji || "🔇",
      layerCount: this.activeGenerators.size,
      isNight: this.isNight,
    });
  }

  private getProfile(): LocationProfile | null {
    const eraProfiles = ERA_SOUND_PROFILES[this.currentEra];
    if (!eraProfiles) return null;
    return eraProfiles[this.currentLocation] || eraProfiles["home"] || null;
  }

  private createGenerator(ctx: AudioContext, gen: SoundGenerator): ActiveGenerator {
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(this.masterGain!);
    const nodes: AudioNode[] = [gainNode];
    const genIntervals: ReturnType<typeof setInterval>[] = [];
    const p = gen.params || {};

    switch (gen.type) {
      case "noise": {
        const noiseType = (p.filter || 500) < 300 ? "brown" : (p.filter || 500) > 2000 ? "white" : "pink";
        const buffer = createNoiseBuffer(ctx, 4, noiseType);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = p.filter || 1000;
        filter.Q.value = p.q || 1;
        source.connect(filter);
        filter.connect(gainNode);
        source.start();
        nodes.push(source, filter);
        break;
      }
      case "crackle": {
        const rate = p.rate || 8;
        const tone = p.tone || 800;
        const schedCrackle = setInterval(() => {
          if (!this.isPlaying || this.isMuted) return;
          const numPops = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < numPops; i++) {
            setTimeout(() => {
              try {
                const osc = ctx.createOscillator();
                const popGain = ctx.createGain();
                osc.type = "square";
                osc.frequency.value = tone + Math.random() * 400;
                popGain.gain.setValueAtTime(0.02 + Math.random() * 0.03, ctx.currentTime);
                popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03 + Math.random() * 0.05);
                osc.connect(popGain);
                popGain.connect(gainNode);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.08);
              } catch {}
            }, Math.random() * (1000 / rate));
          }
        }, 1000 / rate);
        genIntervals.push(schedCrackle);
        const noiseBuffer = createNoiseBuffer(ctx, 2, "brown");
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        noiseSrc.loop = true;
        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 400;
        noiseSrc.connect(lpf);
        lpf.connect(gainNode);
        noiseSrc.start();
        nodes.push(noiseSrc, lpf);
        break;
      }
      case "tone": {
        const osc = ctx.createOscillator();
        osc.type = (p.type === 1) ? "triangle" : "sine";
        osc.frequency.value = p.freq || 200;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gainNode);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, lfoGain);
        break;
      }
      case "rhythm": {
        const freq = p.freq || 200;
        const rate = p.rate || 2;
        const decay = p.decay || 0.1;
        const schedRhythm = setInterval(() => {
          if (!this.isPlaying || this.isMuted) return;
          if (Math.random() > 0.7) return;
          try {
            const osc = ctx.createOscillator();
            const hitGain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.value = freq * (0.8 + Math.random() * 0.4);
            hitGain.gain.setValueAtTime(0.04, ctx.currentTime);
            hitGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
            osc.connect(hitGain);
            hitGain.connect(gainNode);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + decay + 0.05);
          } catch {}
        }, 1000 / rate);
        genIntervals.push(schedRhythm);
        break;
      }
      case "chirp": {
        const freq = p.freq || 3000;
        const rate = p.rate || 3;
        const chirpLen = p.chirpLen || 0.15;
        const schedChirp = setInterval(() => {
          if (!this.isPlaying || this.isMuted) return;
          if (Math.random() > 0.5) return;
          try {
            const osc = ctx.createOscillator();
            const chirpGain = ctx.createGain();
            osc.type = "sine";
            const baseFreq = freq * (0.8 + Math.random() * 0.4);
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + chirpLen * 0.3);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + chirpLen);
            chirpGain.gain.setValueAtTime(0.015, ctx.currentTime);
            chirpGain.gain.setValueAtTime(0.015, ctx.currentTime + chirpLen * 0.6);
            chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + chirpLen);
            osc.connect(chirpGain);
            chirpGain.connect(gainNode);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + chirpLen + 0.05);
          } catch {}
        }, 1000 / rate);
        genIntervals.push(schedChirp);
        break;
      }
      case "rumble": {
        const freq = p.freq || 100;
        const wobble = p.wobble || 2;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = wobble;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = freq * 0.15;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = freq * 2;
        osc.connect(lpf);
        lpf.connect(gainNode);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, lfoGain, lpf);
        break;
      }
      case "chime": {
        const freq = p.freq || 2000;
        const rate = p.rate || 0.5;
        const schedChime = setInterval(() => {
          if (!this.isPlaying || this.isMuted) return;
          if (Math.random() > 0.4) return;
          try {
            const osc = ctx.createOscillator();
            const chimeGain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq * (0.9 + Math.random() * 0.2);
            chimeGain.gain.setValueAtTime(0.02, ctx.currentTime);
            chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.connect(chimeGain);
            chimeGain.connect(gainNode);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1);
          } catch {}
        }, 1000 / rate);
        genIntervals.push(schedChime);
        break;
      }
    }

    return { gainNode, nodes, targetVolume: gen.volume, intervals: genIntervals };
  }

  private fadeGain(gainNode: GainNode, target: number, durationSec: number = 2) {
    try {
      gainNode.gain.cancelScheduledValues(this.ctx!.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, this.ctx!.currentTime);
      gainNode.gain.linearRampToValueAtTime(target, this.ctx!.currentTime + durationSec);
    } catch {}
  }

  async setLocation(era: string, location: string, isNight: boolean = false) {
    if (era === this.currentEra && location === this.currentLocation && isNight === this.isNight) {
      return;
    }
    this.currentEra = era;
    this.currentLocation = location;
    this.isNight = isNight;
    if (!this.isPlaying) {
      this.emitState();
      return;
    }
    await this.transitionTo();
  }

  private async transitionTo() {
    const profile = this.getProfile();
    if (!profile) return;

    const ctx = this.ensureContext();
    let generators = [...profile.generators];
    if (this.isNight) {
      generators = applyNightModifiers(generators);
    }

    const newIds = new Set(generators.map((g) => `${this.currentEra}_${this.currentLocation}_${g.id}`));

    Array.from(this.activeGenerators.entries()).forEach(([key, ag]) => {
      if (!newIds.has(key)) {
        ag.intervals.forEach((id) => clearInterval(id));
        ag.intervals = [];
        this.fadeGain(ag.gainNode, 0, 3);
        setTimeout(() => {
          ag.nodes.forEach((n) => {
            try {
              if (n instanceof AudioScheduledSourceNode) n.stop();
              n.disconnect();
            } catch {}
          });
          this.activeGenerators.delete(key);
        }, 3500);
      }
    });

    for (const gen of generators) {
      const key = `${this.currentEra}_${this.currentLocation}_${gen.id}`;
      if (this.activeGenerators.has(key)) {
        const existing = this.activeGenerators.get(key)!;
        if (existing.targetVolume !== gen.volume) {
          existing.targetVolume = gen.volume;
          this.fadeGain(existing.gainNode, gen.volume, 1.5);
        }
        continue;
      }

      const ag = this.createGenerator(ctx, gen);
      this.activeGenerators.set(key, ag);
      this.fadeGain(ag.gainNode, gen.volume, 2.5);
    }

    this.emitState();
  }

  async play() {
    this.isPlaying = true;
    this.ensureContext();
    await this.transitionTo();
    this.emitState();
  }

  pause() {
    this.isPlaying = false;
    Array.from(this.activeGenerators.entries()).forEach(([key, ag]) => {
      this.fadeGain(ag.gainNode, 0, 1.5);
    });
    setTimeout(() => {
      Array.from(this.activeGenerators.entries()).forEach(([key, ag]) => {
        ag.intervals.forEach((id) => clearInterval(id));
        ag.intervals = [];
        ag.nodes.forEach((n) => {
          try {
            if (n instanceof AudioScheduledSourceNode) n.stop();
            n.disconnect();
          } catch {}
        });
      });
      this.activeGenerators.clear();
      this.emitState();
    }, 2000);
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.masterVolume;
    }
    this.emitState();
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
  }

  setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = this.masterVolume;
    }
    this.emitState();
  }

  getState(): AmbientAudioState {
    const profile = this.getProfile();
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      currentLocation: this.currentLocation,
      currentEra: this.currentEra,
      locationName: profile?.name || "Unknown",
      locationEmoji: profile?.emoji || "🔇",
      layerCount: this.activeGenerators.size,
      isNight: this.isNight,
    };
  }

  destroy() {
    Array.from(this.activeGenerators.values()).forEach((ag) => {
      ag.intervals.forEach((id) => clearInterval(id));
      ag.intervals = [];
      ag.nodes.forEach((n) => {
        try {
          if (n instanceof AudioScheduledSourceNode) n.stop();
          n.disconnect();
        } catch {}
      });
    });
    this.activeGenerators.clear();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
    }
    this.ctx = null;
    this.masterGain = null;
  }
}

export function getAvailableLocations(era: string): Array<{ id: string; name: string; emoji: string }> {
  const profiles = ERA_SOUND_PROFILES[era] || MEDIEVAL_PROFILES;
  return Object.entries(profiles).map(([id, profile]) => ({
    id,
    name: profile.name,
    emoji: profile.emoji,
  }));
}
