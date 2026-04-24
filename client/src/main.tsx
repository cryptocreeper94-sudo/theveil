import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const diag = (s: string, d?: string) => {
  try { (window as any).__diag?.(s, d); } catch {}
};
diag('module_exec', 'all imports resolved, main.tsx running');

(window as any).__tlScriptStarted = true;

function getManifestForRoute(): string {
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith("/signal-chat")) {
    return "/manifest-signal-chat.webmanifest";
  }
  if (path.startsWith("/guardian-scanner")) {
    return "/manifest-guardian.webmanifest";
  }
  if (path.startsWith("/guardian-shield")) {
    return "/manifest-guardian-screener.webmanifest";
  }
  if (path.startsWith("/trust-book")) {
    return "/manifest-trustbook.webmanifest";
  }
  if (host.includes("darkwavegames") || host.includes("games.")) {
    return "/manifest-games.webmanifest";
  }
  if (host.includes("yourlegacy") || host === "yourlegacy.io" || host === "www.yourlegacy.io") {
    return "/manifest-chrono.webmanifest";
  }
  if (host.includes("chronochat") || host === "chronochat.io" || host === "www.chronochat.io" || host.includes("signalchat") || host.includes("signal-chat")) {
    return "/manifest-chronochat.webmanifest";
  }
  if (host.includes("trustshield") || host === "trustshield.tech" || host === "www.trustshield.tech") {
    return "/manifest-trustshield.webmanifest";
  }
  return "/manifest-dwsc.webmanifest";
}

function getThemeColorForDomain(): string {
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith("/signal-chat")) {
    return "#8b5cf6";
  }
  if (path.startsWith("/guardian-scanner")) {
    return "#06b6d4";
  }
  if (path.startsWith("/guardian-shield")) {
    return "#06b6d4";
  }
  if (path.startsWith("/trust-book")) {
    return "#06b6d4";
  }
  if (host.includes("darkwavegames") || host.includes("games.")) {
    return "#ec4899";
  }
  if (host.includes("yourlegacy") || host === "yourlegacy.io" || host === "www.yourlegacy.io") {
    return "#a855f7";
  }
  if (host.includes("chronochat") || host === "chronochat.io" || host === "www.chronochat.io" || host.includes("signalchat") || host.includes("signal-chat")) {
    return "#06b6d4";
  }
  if (host.includes("trustshield") || host === "trustshield.tech" || host === "www.trustshield.tech") {
    return "#06b6d4";
  }
  return "#00ffff";
}

const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
  manifestLink.setAttribute("href", getManifestForRoute());
}

const themeColorMeta = document.querySelector('meta[name="theme-color"]');
if (themeColorMeta) {
  themeColorMeta.setAttribute("content", getThemeColorForDomain());
}

function updateDomainAssets() {
  const host = window.location.hostname.toLowerCase();

  if (host.includes("darkwavegames") || host.includes("games.")) {
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute("href", "/icons/games-icon-512.png");
    }
    document.title = "The Arcade - Play & Win";

    const appTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appTitle) appTitle.setAttribute("content", "The Arcade");

    const existingSplash = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
    existingSplash.forEach(el => el.remove());
    const splashScreens = [
      { href: "/splash/games-splash-1290x2796.jpg", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/games-splash-1290x2796.jpg", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/games-splash-1290x2796.jpg", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/games-splash-1290x2796.jpg", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
    ];
    splashScreens.forEach(({ href, media }) => {
      const link = document.createElement("link");
      link.rel = "apple-touch-startup-image";
      link.href = href;
      link.media = media;
      document.head.appendChild(link);
    });
  }

  if (host.includes("trustshield") || host === "trustshield.tech" || host === "www.trustshield.tech") {
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute("href", "/icons/trustshield-192.png");
    }
    document.title = "TrustShield - AI Agent Certification";

    const splashScreens = [
      { href: "/splash/trustshield-splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/trustshield-splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/trustshield-splash-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/trustshield-splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/trustshield-splash-1080x1920.png", media: "(device-width: 360px) and (device-height: 640px) and (-webkit-device-pixel-ratio: 3)" },
      { href: "/splash/trustshield-splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { href: "/splash/trustshield-splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { href: "/splash/trustshield-splash-2048x1536.png", media: "(device-width: 1024px) and (device-height: 768px) and (-webkit-device-pixel-ratio: 2)" },
    ];
    const existingSplash = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
    existingSplash.forEach(el => el.remove());
    splashScreens.forEach(({ href, media }) => {
      const link = document.createElement("link");
      link.rel = "apple-touch-startup-image";
      link.href = href;
      link.media = media;
      document.head.appendChild(link);
    });
  }
}
updateDomainAssets();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.update();
    }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('SW registered:', registration.scope);
        registration.update();
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

try {
  diag('pre_render', 'about to call createRoot');
  (window as any).__tlLoaded = true;
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    diag('no_root', 'root element not found');
  } else {
    const root = createRoot(rootEl);
    diag('root_created', 'createRoot succeeded');
    root.render(<App />);
    diag('render_called', 'render() called successfully');
  }
} catch (err: any) {
  diag('render_error', err?.message || String(err));
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:2rem;background:#0a0f1e"><div style="text-align:center;max-width:420px"><div style="font-size:48px;margin-bottom:16px">&#9888;</div><h2 style="color:#22d3ee;margin-bottom:8px;font-family:system-ui">Startup Error</h2><p style="color:#94a3b8;font-size:13px;font-family:monospace;word-break:break-all;margin-bottom:16px">${err?.message || err}</p><button onclick="location.reload()" style="background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;border:none;border-radius:12px;padding:14px 32px;font-size:16px;cursor:pointer;font-weight:600">Reload</button></div></div>`;
  }
  console.error("[STARTUP]", err);
}
