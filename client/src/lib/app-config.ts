export type AppDomain = "dwsc" | "games" | "chrono" | "chronochat" | "strikeagent" | "studios" | "trustshield";

export function getAppFromHost(): AppDomain {
  const host = window.location.hostname.toLowerCase();
  
  if (host.includes("darkwavestudios") || host === "darkwavestudios.io" || host === "www.darkwavestudios.io" || host === "darkwavestudios.net" || host === "www.darkwavestudios.net") {
    return "studios";
  }
  if (host.includes("darkwavegames") || host.includes("games.")) {
    return "games";
  }
  if (host.includes("chronochat") || host === "chronochat.io" || host === "www.chronochat.io" || host.includes("signalchat") || host.includes("signal-chat")) {
    return "chronochat";
  }
  if (host.includes("yourlegacy") || host.includes("chrono.") || host === "yourlegacy.io" || host === "www.yourlegacy.io") {
    return "chrono";
  }
  if (host.includes("strikeagent") || host === "strikeagent.io" || host === "www.strikeagent.io") {
    return "strikeagent";
  }
  if (host.includes("trustshield") || host === "trustshield.tech" || host === "www.trustshield.tech") {
    return "trustshield";
  }
  return "dwsc";
}

export const APP_CONFIG: Record<AppDomain, {
  name: string;
  shortName: string;
  themeColor: string;
  description: string;
  logoText: string;
  primaryGradient: string;
}> = {
  dwsc: {
    name: "Trust Layer",
    shortName: "Trust Layer",
    themeColor: "#8b5cf6",
    description: "Infrastructure where accountability is built in",
    logoText: "Trust Layer",
    primaryGradient: "from-purple-500 to-pink-500",
  },
  studios: {
    name: "DarkWave Studios",
    shortName: "Studios",
    themeColor: "#6366f1",
    description: "Build. Create. Deploy.",
    logoText: "DarkWave Studios",
    primaryGradient: "from-indigo-500 to-purple-500",
  },
  games: {
    name: "The Arcade",
    shortName: "Arcade",
    themeColor: "#ec4899",
    description: "Premium arcade games, sweepstakes, and classic card games",
    logoText: "The Arcade",
    primaryGradient: "from-pink-500 to-purple-500",
  },
  chrono: {
    name: "Chronicles",
    shortName: "Chronicles",
    themeColor: "#a855f7",
    description: "Not a game. A life. Live your legacy.",
    logoText: "Chronicles",
    primaryGradient: "from-purple-500 to-pink-500",
  },
  chronochat: {
    name: "Signal Chat",
    shortName: "Signal Chat",
    themeColor: "#06b6d4",
    description: "Connect across the network",
    logoText: "Signal Chat",
    primaryGradient: "from-cyan-500 to-purple-500",
  },
  strikeagent: {
    name: "Strike Agent",
    shortName: "Strike",
    themeColor: "#22c55e",
    description: "AI-powered token discovery & safety analysis",
    logoText: "Strike Agent",
    primaryGradient: "from-emerald-500 to-cyan-500",
  },
  trustshield: {
    name: "TrustShield",
    shortName: "TrustShield",
    themeColor: "#06b6d4",
    description: "The world's first AI agent certification system. Verify, certify, and protect autonomous AI.",
    logoText: "TrustShield",
    primaryGradient: "from-cyan-500 to-purple-500",
  },
};

export function getCurrentAppConfig() {
  return APP_CONFIG[getAppFromHost()];
}
