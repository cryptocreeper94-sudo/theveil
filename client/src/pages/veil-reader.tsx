import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, ChevronLeft, ChevronRight, Menu, X, Home, Lock,
  BookMarked, ScrollText, FileText, ExternalLink, Volume2, VolumeX, Pause, Play, Download, ArrowLeft, Sparkles, Bell, Loader2,
  Feather, Crown, Flame, Eye, Star, Square
} from "lucide-react";
import { Link } from "wouter";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

type ChangelogEntry = {
  version: string;
  date: string;
  updates: {
    type: 'added' | 'updated' | 'removed';
    description: string;
    chapterId?: string;
    volumeIndex?: number;
  }[];
};

const EBOOK_CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.0.0",
    date: "February 4, 2026",
    updates: [
      { type: 'added', description: 'MAJOR: E-reader now syncs directly with the master ebook file', chapterId: 'v1-introduction', volumeIndex: 0 },
      { type: 'added', description: 'All 52 chapters now display complete content from the source document', chapterId: 'v1-introduction', volumeIndex: 0 },
      { type: 'added', description: 'Added Leviathan vs Ouroboros distinction - biblical creature vs pagan eternal cycle symbol', chapterId: 'v1-dragons', volumeIndex: 0 },
      { type: 'updated', description: 'Replaced "hell" with "Tartaros" in 2 Peter 2:4 references (accurate to Greek original)', chapterId: 'v1-watchers', volumeIndex: 0 },
    ]
  },
  {
    version: "2.1.0",
    date: "February 4, 2026",
    updates: [
      { type: 'added', description: 'NEW SECTION: The Planet X Deception - exposing the deliberate conflation of two unrelated concepts', chapterId: 'v1-forbidden-knowledge', volumeIndex: 0 },
      { type: 'added', description: 'Planet X history: legitimate 1902-1930s astronomy (Lowell, Tombaugh, Pluto) vs Sitchin\'s 1976 fabrication', chapterId: 'v1-forbidden-knowledge', volumeIndex: 0 },
    ]
  },
  {
    version: "2.0.0",
    date: "February 4, 2026",
    updates: [
      { type: 'added', description: 'NEW EPIGRAPH PAGE: Revelation 22:18-19 placed prominently in front matter before any content begins', chapterId: 'v1-front-matter', volumeIndex: 0 },
      { type: 'added', description: 'Clear author statement: "I do not add to Scripture. I do not take away from it. I simply illuminate what is already written."', chapterId: 'v1-front-matter', volumeIndex: 0 },
    ]
  },
  {
    version: "1.0.0",
    date: "January 28, 2026",
    updates: [
      { type: 'added', description: 'Initial release - complete ebook with all chapters', chapterId: 'v1-introduction', volumeIndex: 0 },
    ]
  }
];

const CURRENT_VERSION = "3.0.0";
const STORAGE_KEY = 'veil-reader-user-data';

function useVeilPWA() {
  useEffect(() => {
    document.title = "Through The Veil | The Greatest Story Ever Stole?";
    
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = '/manifest-veil.webmanifest';
    }
    
    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeColor) {
      themeColor.content = '#a855f7';
    }
    
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (appleTitle) {
      appleTitle.content = 'Through The Veil';
    }

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = '/icons/veil-192x192.png';
    }

    return () => {
      if (manifestLink) manifestLink.href = '/manifest.webmanifest';
      if (themeColor) themeColor.content = '#00ffff';
      if (appleTitle) appleTitle.content = 'Trust Layer';
      if (appleIcon) appleIcon.href = '/icons/icon-192x192.png';
    };
  }, []);
}

type Chapter = {
  id: string;
  title: string;
  content: string;
  partTitle?: string;
};

type Volume = {
  id: string;
  title: string;
  subtitle: string;
  chapters: Chapter[];
};

type TocVolume = {
  id: string;
  title: string;
  subtitle: string;
  chapters: { id: string; title: string; partTitle?: string }[];
};

export default function VeilReader() {
  useVeilPWA();
  
  const [toc, setToc] = useState<TocVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chapterCacheRef = useRef<Map<string, Chapter>>(new Map());
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null);
  
  const [currentVolume, setCurrentVolume] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [returnPosition, setReturnPosition] = useState<{ vol: number; chap: number; scrollY: number } | null>(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [hasSeenUpdates, setHasSeenUpdates] = useState(false);
  const [newUpdatesSinceVisit, setNewUpdatesSinceVisit] = useState<ChangelogEntry[]>([]);
  
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useAIVoice, setUseAIVoice] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedChapterRef = useRef<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const audioUnlockedRef = useRef(false);
  const speechChunksRef = useRef<SpeechSynthesisUtterance[]>([]);
  const speechChunkIndexRef = useRef(0);
  const speechKeepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiChunksRef = useRef<string[]>([]);
  const aiChunkIndexRef = useRef(0);
  const aiPlayingRef = useRef(false);
  const aiCancelledRef = useRef(false);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const webAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const webAudioStartTimeRef = useRef(0);
  const webAudioOffsetRef = useRef(0);
  const webAudioBufferRef = useRef<AudioBuffer | null>(null);
  const browserSpeechUnlockedRef = useRef(false);
  const audioPlayResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    const isPaywalledDomain = host.includes("throughtheveil") || host.includes("trustbook");

    if (!isPaywalledDomain) {
      setHasPurchased(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.id) {
            setUserId(data.user.id);
            const accessRes = await fetch(`/api/ebook/access/through-the-veil?userId=${data.user.id}`);
            if (accessRes.ok) {
              const accessData = await accessRes.json();
              setHasPurchased(accessData.purchased);
              return;
            }
          }
        }
      } catch {}
      setHasPurchased(false);
    };
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchased') === 'true') {
      setHasPurchased(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      checkAuth();
    }
  }, []);

  const isPreviewOnly = hasPurchased === false;
  const FREE_PREVIEW_CHAPTERS = 4;

  const loadToc = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const previewParam = isPreviewOnly ? '?preview=true' : '';
      const response = await fetch('/api/veil/toc' + previewParam, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid book data');
      setToc(data);
      setLoading(false);
    } catch (err: any) {
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1500));
        return loadToc(retryCount + 1);
      }
      setError(err?.name === 'AbortError' ? 'Loading took too long. Tap Try Again.' : (err?.message || 'Failed to load book'));
      setLoading(false);
    }
  };

  const loadChapter = async (volIdx: number, chapIdx: number) => {
    const cacheKey = `${volIdx}-${chapIdx}`;
    const cached = chapterCacheRef.current.get(cacheKey);
    if (cached) {
      setChapterContent(cached);
      return;
    }
    setChapterLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(`/api/veil/chapter/${volIdx}/${chapIdx}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Failed to load chapter`);
      const data = await response.json();
      const chapter: Chapter = { id: data.id, title: data.title, content: data.content, partTitle: data.partTitle };
      chapterCacheRef.current.set(cacheKey, chapter);
      setChapterContent(chapter);
    } catch (err: any) {
      setChapterContent({ id: 'error', title: 'Loading Error', content: 'Failed to load this chapter. Please try again or check your connection.', partTitle: '' });
    } finally {
      setChapterLoading(false);
    }
  };

  useEffect(() => {
    if (hasPurchased !== null) {
      loadToc();
    }
  }, [hasPurchased]);

  useEffect(() => {
    if (toc.length > 0) {
      loadChapter(currentVolume, currentChapter);
    }
  }, [currentVolume, currentChapter, toc]);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setSpeechSupported(supported);
    if (supported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (toc.length === 0) return;
    
    const hash = window.location.hash.slice(1);
    if (hash) {
      for (let volIdx = 0; volIdx < toc.length; volIdx++) {
        const vol = toc[volIdx];
        for (let chapIdx = 0; chapIdx < vol.chapters.length; chapIdx++) {
          const chap = vol.chapters[chapIdx];
          const normalizedHash = hash.toLowerCase().replace(/-/g, ' ');
          const normalizedTitle = chap.title.toLowerCase();
          const normalizedId = chap.id.toLowerCase().replace(/-/g, ' ');
          
          if (chap.id === hash || 
              normalizedId.includes(normalizedHash) || 
              normalizedTitle.includes(normalizedHash) ||
              normalizedHash.includes('chapter') && normalizedTitle.includes(normalizedHash.replace('chapter', '').trim())) {
            setCurrentVolume(volIdx);
            setCurrentChapter(chapIdx);
            window.scrollTo(0, 0);
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }
      }
    }
  }, [toc]);

  useEffect(() => {
    if (toc.length === 0) return;
    
    const hash = window.location.hash.slice(1);
    if (hash) return;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const structureVersion = 2;
        if (data.structureVersion !== structureVersion) {
          localStorage.removeItem(STORAGE_KEY);
          setCurrentVolume(0);
          setCurrentChapter(0);
          return;
        }
        if (data.currentVolume !== undefined && data.currentVolume < toc.length) {
          setCurrentVolume(data.currentVolume);
        }
        if (data.currentChapter !== undefined) {
          const vol = toc[data.currentVolume || 0];
          if (vol && data.currentChapter < vol.chapters.length) {
            setCurrentChapter(data.currentChapter);
          }
        }
        
        if (data.lastSeenVersion) {
          const newUpdates = EBOOK_CHANGELOG.filter(entry => {
            return entry.version > data.lastSeenVersion;
          });
          setNewUpdatesSinceVisit(newUpdates);
          if (newUpdates.length > 0) {
            setShowWhatsNew(true);
          }
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, [toc]);

  useEffect(() => {
    if (toc.length === 0) return;
    
    const data = {
      currentVolume,
      currentChapter,
      structureVersion: 2,
      lastSeenVersion: hasSeenUpdates ? CURRENT_VERSION : undefined
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [currentVolume, currentChapter, hasSeenUpdates, toc]);

  const [ttsError, setTtsError] = useState<string | null>(null);
  const [voiceProvider, setVoiceProvider] = useState<string>('');

  const getOrCreateWebAudioCtx = (): AudioContext => {
    if (webAudioCtxRef.current && webAudioCtxRef.current.state !== 'closed') {
      return webAudioCtxRef.current;
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    webAudioCtxRef.current = ctx;
    return ctx;
  };

  const stopWebAudioSource = () => {
    if (webAudioSourceRef.current) {
      try { webAudioSourceRef.current.onended = null; webAudioSourceRef.current.stop(); } catch {}
      webAudioSourceRef.current = null;
    }
    webAudioBufferRef.current = null;
    webAudioStartTimeRef.current = 0;
    webAudioOffsetRef.current = 0;
  };

  const cleanupAudio = () => {
    aiCancelledRef.current = true;
    aiPlayingRef.current = false;
    aiChunksRef.current = [];
    aiChunkIndexRef.current = 0;
    stopWebAudioSource();
    if (audioElementRef.current) {
      try { audioElementRef.current.pause(); audioElementRef.current.onended = null; audioElementRef.current.onerror = null; audioElementRef.current.src = ''; } catch {}
    }
    if (audioPlayResolveRef.current) {
      audioPlayResolveRef.current();
      audioPlayResolveRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechKeepAliveRef.current) {
      clearInterval(speechKeepAliveRef.current);
      speechKeepAliveRef.current = null;
    }
    speechChunksRef.current = [];
    speechChunkIndexRef.current = 0;
  };

  const unlockWebAudio = async (): Promise<AudioContext> => {
    const ctx = getOrCreateWebAudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlockedRef.current = true;
    console.log('[Veil Audio] Web Audio API unlocked from gesture, state:', ctx.state);
    return ctx;
  };

  const unlockBrowserSpeech = () => {
    if (browserSpeechUnlockedRef.current) return;
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      u.rate = 10;
      window.speechSynthesis.speak(u);
      browserSpeechUnlockedRef.current = true;
      console.log('[Veil Audio] Browser speech unlocked from gesture');
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (webAudioCtxRef.current && webAudioCtxRef.current.state !== 'closed') {
        webAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const splitTextIntoChunks = (text: string, maxLen = 3000): string[] => {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLen) {
        chunks.push(remaining);
        break;
      }
      let splitAt = remaining.lastIndexOf('. ', maxLen);
      if (splitAt < maxLen * 0.5) splitAt = remaining.lastIndexOf('? ', maxLen);
      if (splitAt < maxLen * 0.5) splitAt = remaining.lastIndexOf('! ', maxLen);
      if (splitAt < maxLen * 0.5) splitAt = remaining.lastIndexOf('\n', maxLen);
      if (splitAt < maxLen * 0.3) splitAt = remaining.lastIndexOf(' ', maxLen);
      if (splitAt < 200) splitAt = maxLen;
      chunks.push(remaining.substring(0, splitAt + 1).trim());
      remaining = remaining.substring(splitAt + 1).trim();
    }
    return chunks.filter(c => c.length > 0);
  };

  const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
      promise.then((v) => { clearTimeout(timer); resolve(v); }).catch((e) => { clearTimeout(timer); reject(e); });
    });
  };

  const isIOSRef = useRef(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const fetchChunkAudio = async (chunkText: string): Promise<{ rawData: ArrayBuffer; provider: string }> => {
    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), 45000);

    const response = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunkText }),
      signal: controller.signal
    });
    clearTimeout(fetchTimer);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Voice server error (${response.status})`);
    }

    const providerHeader = response.headers.get('X-Voice-Provider') || 'ai';
    const voiceName = response.headers.get('X-Voice-Name') || '';
    const provider = providerHeader === 'elevenlabs' ? `ElevenLabs ${voiceName}` : `OpenAI ${voiceName}`;

    const arrayBuffer = await withTimeout(response.arrayBuffer(), 30000, 'Audio download');
    if (arrayBuffer.byteLength < 100) throw new Error('Empty audio response');

    console.log(`[Veil Audio] Fetched chunk: ${(arrayBuffer.byteLength / 1024).toFixed(0)}KB`);
    return { rawData: arrayBuffer, provider };
  };

  const playAudioViaElement = async (rawData: ArrayBuffer): Promise<void> => {
    return new Promise<void>((resolve) => {
      const safeResolve = () => {
        audioPlayResolveRef.current = null;
        resolve();
      };
      audioPlayResolveRef.current = safeResolve;

      try {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
        const blob = new Blob([rawData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
          audioElementRef.current.preload = 'auto';
        }
        const audio = audioElementRef.current;

        audio.onended = null;
        audio.onerror = null;
        audio.onpause = null;

        audio.src = url;
        audio.volume = 1.0;
        audio.currentTime = 0;

        const safetyTimer = setTimeout(() => {
          console.warn('[Veil Audio] Audio element safety timeout (5 min)');
          safeResolve();
        }, 300000);

        const cleanup = () => {
          clearTimeout(safetyTimer);
          audio.onended = null;
          audio.onerror = null;
        };

        audio.onended = () => {
          cleanup();
          console.log('[Veil Audio] Audio chunk ended naturally');
          safeResolve();
        };

        audio.onerror = (e) => {
          cleanup();
          console.error('[Veil Audio] Audio element error:', e);
          safeResolve();
        };

        audio.load();

        const playPromise = audio.play();
        if (playPromise) {
          playPromise.then(() => {
            console.log(`[Veil Audio] Audio playing (${(rawData.byteLength / 1024).toFixed(0)}KB)`);
          }).catch((err) => {
            console.error('[Veil Audio] audio.play() rejected, retrying...', err);
            setTimeout(() => {
              if (!audioElementRef.current || audioElementRef.current !== audio) {
                cleanup();
                safeResolve();
                return;
              }
              const retry = audio.play();
              if (retry) {
                retry.then(() => {
                  console.log('[Veil Audio] Retry play succeeded');
                }).catch((retryErr) => {
                  console.error('[Veil Audio] Retry play also failed:', retryErr);
                  cleanup();
                  safeResolve();
                });
              }
            }, 300);
          });
        }
      } catch (err) {
        console.error('[Veil Audio] Playback setup error:', err);
        safeResolve();
      }
    });
  };

  const fetchWithRetry = async (chunkText: string, retries = 2): Promise<{ rawData: ArrayBuffer; provider: string }> => {
    try {
      return await fetchChunkAudio(chunkText);
    } catch (err) {
      if (retries > 0) {
        console.warn(`[Veil Audio] Chunk fetch failed, retrying... (${retries} left)`);
        await new Promise(r => setTimeout(r, 1500));
        return fetchWithRetry(chunkText, retries - 1);
      }
      throw err;
    }
  };

  const playWithAIVoice = async (text: string) => {
    setIsLoading(true);
    setTtsError(null);
    aiCancelledRef.current = false;
    let loadingTimeoutCleared = false;
    
    const loadingTimeout = setTimeout(() => {
      if (aiCancelledRef.current || loadingTimeoutCleared) return;
      console.warn('[Veil Audio] Loading timeout hit (30s) — falling back to browser voice');
      cleanupAudio();
      setIsLoading(false);
      aiPlayingRef.current = false;
      setVoiceProvider('Browser Voice');
      setTtsError('AI voice took too long to load — using browser voice instead.');
      tryBrowserSpeech(text);
    }, 30000);

    const clearLoadingTimeout = () => {
      if (!loadingTimeoutCleared) {
        loadingTimeoutCleared = true;
        clearTimeout(loadingTimeout);
      }
    };

    try {
      const chunks = splitTextIntoChunks(text);
      aiChunksRef.current = chunks;
      aiChunkIndexRef.current = 0;
      aiPlayingRef.current = true;
      let consecutiveFailures = 0;

      console.log(`[Veil Audio] Starting playback: ${chunks.length} chunks, ${text.length} chars total`);

      let nextChunkPromise: Promise<{ rawData: ArrayBuffer; provider: string }> | null = null;

      for (let i = 0; i < chunks.length; i++) {
        if (aiCancelledRef.current) { clearLoadingTimeout(); return; }
        
        aiChunkIndexRef.current = i;

        let result: { rawData: ArrayBuffer; provider: string } | null = null;

        try {
          if (i === 0) {
            result = await fetchWithRetry(chunks[i]);
            clearLoadingTimeout();
            setVoiceProvider(result.provider);
            setIsPlaying(true);
            setIsLoading(false);
            consecutiveFailures = 0;
          } else if (nextChunkPromise) {
            result = await nextChunkPromise;
            nextChunkPromise = null;
            if (!result || !result.rawData) {
              console.warn(`[Veil Audio] Pre-fetch returned null for chunk ${i + 1}, fetching directly`);
              result = await fetchWithRetry(chunks[i]);
            }
            setVoiceProvider(result.provider);
            consecutiveFailures = 0;
          } else {
            result = await fetchWithRetry(chunks[i]);
            setVoiceProvider(result.provider);
            consecutiveFailures = 0;
          }
        } catch (chunkErr: any) {
          consecutiveFailures++;
          console.warn(`[Veil Audio] Chunk ${i + 1}/${chunks.length} failed (${consecutiveFailures} consecutive): ${chunkErr.message}`);
          nextChunkPromise = null;
          if (i === 0 || consecutiveFailures >= 3) {
            console.warn('[Veil Audio] Too many failures, falling back to browser voice');
            clearLoadingTimeout();
            throw chunkErr;
          }
          continue;
        }

        if (aiCancelledRef.current) return;

        if (i + 1 < chunks.length) {
          console.log(`[Veil Audio] Pre-fetching chunk ${i + 2}/${chunks.length}`);
          nextChunkPromise = fetchWithRetry(chunks[i + 1]).catch(() => {
            console.warn(`[Veil Audio] Pre-fetch failed for chunk ${i + 2}, will retry during playback`);
            return null as any;
          });
        }

        console.log(`[Veil Audio] Playing chunk ${i + 1}/${chunks.length} via <audio> element`);
        await playAudioViaElement(result.rawData);

        if (aiCancelledRef.current) return;
      }

      if (!aiCancelledRef.current) {
        console.log('[Veil Audio] All chunks complete, advancing to next chapter');
        setIsPlaying(false);
        setIsPaused(false);
        aiPlayingRef.current = false;
        handleNextChapterAuto();
      }
    } catch (err: any) {
      clearLoadingTimeout();
      console.error('[Veil Audio] AI voice error, switching to browser voice:', err.message);
      setIsLoading(false);
      setIsPlaying(false);
      aiPlayingRef.current = false;
      setVoiceProvider('Browser Voice');
      tryBrowserSpeech(text);
    }
  };

  const [voicePermanentFail, setVoicePermanentFail] = useState(false);

  const tryBrowserSpeech = (text: string) => {
    setVoiceProvider('Browser');
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        const waitForVoices = (): Promise<boolean> => {
          return new Promise((resolve) => {
            const check = () => {
              if (window.speechSynthesis.getVoices().length > 0) {
                resolve(true);
              } else {
                setTimeout(check, 100);
              }
            };
            check();
            setTimeout(() => resolve(false), 2000);
          });
        };
        waitForVoices().then((hasVoices) => {
          if (hasVoices) {
            playWithBrowserSpeech(text);
          } else {
            setVoicePermanentFail(true);
            setIsLoading(false);
            setTtsError('No voices available on this device. Download the PDF — Adobe Reader can read it aloud.');
          }
        });
      } else {
        playWithBrowserSpeech(text);
      }
    } else {
      setVoicePermanentFail(true);
      setIsLoading(false);
      setTtsError('Voice not available on this device. Download the PDF — Adobe Reader can read it aloud.');
    }
  };

  const splitForBrowserSpeech = (text: string, maxLen = 200): string[] => {
    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if ((current + sentence).length > maxLen && current.length > 0) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  };

  const playWithBrowserSpeech = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      
      const chunks = splitForBrowserSpeech(text, 200);
      if (chunks.length === 0) {
        setTtsError('No text to read.');
        return;
      }

      speechChunksRef.current = [];
      speechChunkIndexRef.current = 0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.lang.startsWith('en')
      ) || voices[0] || null;

      if (speechKeepAliveRef.current) {
        clearInterval(speechKeepAliveRef.current);
        speechKeepAliveRef.current = null;
      }
      speechKeepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      const speakChunk = (index: number) => {
        if (index >= chunks.length) {
          setIsPlaying(false);
          setIsPaused(false);
          if (speechKeepAliveRef.current) {
            clearInterval(speechKeepAliveRef.current);
            speechKeepAliveRef.current = null;
          }
          handleNextChapterAuto();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.onstart = () => {
          setIsPlaying(true);
          setTtsError(null);
        };
        
        utterance.onend = () => {
          speechChunkIndexRef.current = index + 1;
          speakChunk(index + 1);
        };
        
        utterance.onerror = (e) => {
          if ((e as any).error === 'interrupted' || (e as any).error === 'canceled') return;
          console.error('Browser speech chunk error:', e);
          if (index === 0) {
            setIsPlaying(false);
            setVoicePermanentFail(true);
            setTtsError('Voice failed on this device. Tap download for the PDF — Adobe Reader can read it aloud.');
            if (speechKeepAliveRef.current) {
              clearInterval(speechKeepAliveRef.current);
              speechKeepAliveRef.current = null;
            }
          } else {
            speechChunkIndexRef.current = index + 1;
            speakChunk(index + 1);
          }
        };
        
        speechChunksRef.current.push(utterance);
        window.speechSynthesis.speak(utterance);
      };

      speakChunk(0);
      setIsPlaying(true);
    } catch (e) {
      console.error('Browser speech exception:', e);
      setTtsError('Voice not available. Tap download for the PDF — Adobe Reader can read it aloud.');
    }
  };

  useEffect(() => {
    if (ttsError) {
      const timer = setTimeout(() => setTtsError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [ttsError]);

  const autoPlayNextRef = useRef(false);

  const handleNextChapterAuto = () => {
    if (toc.length === 0) return;
    
    const volume = toc[currentVolume];
    if (!volume) return;
    
    if (currentChapter < volume.chapters.length - 1) {
      const nextChapter = currentChapter + 1;
      setCurrentChapter(nextChapter);
      lastPlayedChapterRef.current = null;
      autoPlayNextRef.current = true;
      window.scrollTo(0, 0);
    } else if (currentVolume < toc.length - 1) {
      const nextVolume = currentVolume + 1;
      setCurrentVolume(nextVolume);
      setCurrentChapter(0);
      lastPlayedChapterRef.current = null;
      autoPlayNextRef.current = true;
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    if (autoPlayNextRef.current && toc.length > 0 && chapterContent) {
      // Only play when the chapter content has actually loaded for the current chapter
      const vol = toc[currentVolume];
      if (!vol) return;
      const expectedChap = vol.chapters[currentChapter];
      if (!expectedChap) return;
      // Verify the loaded content matches what we're supposed to be on
      if (chapterContent.id === expectedChap.id && !chapterLoading) {
        autoPlayNextRef.current = false;
        const timer = setTimeout(() => {
          handlePlay();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentVolume, currentChapter, chapterContent, chapterLoading]);

  const cleanTextForSpeech = (content: string) => {
    return content
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/[^\s)]+/g, '')
      .replace(/[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF\uFE0F\u200D]+/g, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~`]/g, '')
      .replace(/^[\-*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/\|/g, ',')
      .replace(/---+/g, '')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handlePlay = async () => {
    if (toc.length === 0 || !chapterContent) return;
    
    const chapter = chapterContent;
    const chapterId = `${currentVolume}-${currentChapter}`;
    
    if (isPaused && lastPlayedChapterRef.current === chapterId) {
      if (audioElementRef.current && audioElementRef.current.paused && audioElementRef.current.src) {
        try {
          await audioElementRef.current.play();
          setIsPlaying(true);
          setIsPaused(false);
          console.log('[Veil Audio] Resumed audio element playback');
        } catch (err) {
          console.error('[Veil Audio] Resume play failed:', err);
        }
        return;
      }
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      }
    }
    
    cleanupAudio();

    const text = cleanTextForSpeech(chapter.content);
    
    if (!text || text.length === 0) {
      setTtsError('This chapter has no readable text.');
      return;
    }
    
    lastPlayedChapterRef.current = chapterId;
    setUseAIVoice(true);

    unlockBrowserSpeech();
    
    await playWithAIVoice(text);
  };

  const handlePause = () => {
    if (speechKeepAliveRef.current) {
      clearInterval(speechKeepAliveRef.current);
      speechKeepAliveRef.current = null;
    }
    if (audioElementRef.current && isPlaying && !audioElementRef.current.paused) {
      audioElementRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
      console.log('[Veil Audio] Audio element paused (chunk loop still alive)');
      return;
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    cleanupAudio();
    setIsPlaying(false);
    setIsPaused(false);
    lastPlayedChapterRef.current = null;
  };

  const handleDownloadPDF = () => {
    if (isIOSRef.current) {
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

  const navigateToUpdate = (volumeIndex?: number, chapterId?: string) => {
    if (volumeIndex !== undefined && toc.length > volumeIndex) {
      setCurrentVolume(volumeIndex);
      if (chapterId) {
        const chapIdx = toc[volumeIndex].chapters.findIndex(ch => ch.id === chapterId);
        if (chapIdx >= 0) {
          setCurrentChapter(chapIdx);
        }
      }
    }
    setShowWhatsNew(false);
    setHasSeenUpdates(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10 px-4"
        >
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-t-purple-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/5" />
            <BookOpen className="absolute inset-0 m-auto w-7 h-7 text-purple-400" />
          </div>
          <p className="text-slate-200 text-lg font-medium mb-2">Opening your book...</p>
          <p className="text-sm bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-semibold tracking-wide mb-4">Through The Veil</p>
          <p className="text-slate-500 text-xs">52 chapters · 107,000 words</p>
        </motion.div>
      </div>
    );
  }

  if (error || toc.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm relative z-10"
        >
          <GlassCard glow className="p-8">
            <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <X className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-red-300 mb-2 font-medium text-lg">{error || 'Failed to load content'}</p>
            <p className="text-slate-500 text-sm mb-6">This can happen on slower connections. Tap below to try again.</p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  if ('caches' in window) {
                    caches.keys().then(k => k.forEach(n => caches.delete(n)));
                  }
                  setError(null);
                  setLoading(true);
                  setTimeout(() => loadToc(), 300);
                }} 
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all w-full py-5"
                data-testid="button-retry-load"
              >
                Clear Cache & Try Again
              </Button>
              <Link href="/veil">
                <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white w-full py-5">
                  Return to Book Page
                </Button>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  const volume = toc[currentVolume] || toc[0];
  if (!volume) return null;
  const chapter = chapterContent || { id: '', title: volume.chapters?.[currentChapter]?.title || 'Loading...', content: '', partTitle: '' };
  
  const totalChapters = toc.reduce((acc, v) => acc + v.chapters.length, 0);
  const currentGlobalIndex = toc.slice(0, currentVolume).reduce((acc, v) => acc + v.chapters.length, 0) + currentChapter;

  const getGlobalChapterIndex = (volIdx: number, chapIdx: number) => {
    let idx = 0;
    for (let v = 0; v < volIdx; v++) {
      idx += toc[v]?.chapters.length || 0;
    }
    return idx + chapIdx;
  };

  const goNext = () => {
    if (isPreviewOnly) {
      const nextGlobal = getGlobalChapterIndex(currentVolume, currentChapter) + 1;
      if (nextGlobal >= FREE_PREVIEW_CHAPTERS) return;
    }
    if (currentChapter < volume.chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
    } else if (currentVolume < toc.length - 1) {
      setCurrentVolume(currentVolume + 1);
      setCurrentChapter(0);
    }
    window.scrollTo(0, 0);
  };

  const goPrev = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    } else if (currentVolume > 0) {
      setCurrentVolume(currentVolume - 1);
      setCurrentChapter(toc[currentVolume - 1].chapters.length - 1);
    }
    window.scrollTo(0, 0);
  };

  const goToChapter = (volIndex: number, chapIndex: number) => {
    if (isPreviewOnly) {
      const targetGlobal = getGlobalChapterIndex(volIndex, chapIndex);
      if (targetGlobal >= FREE_PREVIEW_CHAPTERS) return;
    }
    setCurrentVolume(volIndex);
    setCurrentChapter(chapIndex);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const navigateToInternalLink = (href: string) => {
    if (!href.startsWith('#')) return false;
    const target = href.slice(1);
    
    if (target.startsWith('ch-')) {
      setReturnPosition({ vol: currentVolume, chap: currentChapter, scrollY: window.scrollY });
      for (let volIdx = 0; volIdx < toc.length; volIdx++) {
        for (let chapIdx = 0; chapIdx < toc[volIdx].chapters.length; chapIdx++) {
          if (toc[volIdx].chapters[chapIdx].id === target) {
            goToChapter(volIdx, chapIdx);
            return true;
          }
        }
      }
    }
    
    if (target.startsWith('concordance-')) {
      setReturnPosition({ vol: currentVolume, chap: currentChapter, scrollY: window.scrollY });
      for (let volIdx = 0; volIdx < toc.length; volIdx++) {
        for (let chapIdx = 0; chapIdx < toc[volIdx].chapters.length; chapIdx++) {
          const chId = toc[volIdx].chapters[chapIdx].id;
          const cachedCh = chapterCacheRef.current.get(`${volIdx}-${chapIdx}`);
          if (cachedCh && cachedCh.content.includes(`id="${target}"`)) {
            setCurrentVolume(volIdx);
            setCurrentChapter(chapIdx);
            setSidebarOpen(false);
            setTimeout(() => {
              const el = document.getElementById(target);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
            return true;
          }
        }
      }
    }
    
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    
    return false;
  };

  const hasNext = currentChapter < volume.chapters.length - 1 || currentVolume < toc.length - 1;
  const hasPrev = currentChapter > 0 || currentVolume > 0;
  const progressPercent = Math.round(((currentGlobalIndex + 1) / totalChapters) * 100);

  return (
    <div className="min-h-screen bg-slate-950 relative">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl border-b border-purple-500/15" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="container mx-auto px-4 py-2.5 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all rounded-xl"
              data-testid="button-toggle-sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20 shadow-sm shadow-purple-500/10">
                <BookOpen className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{volume.title}</p>
                <p className="text-sm text-white font-medium truncate max-w-[160px] sm:max-w-[300px] md:max-w-[400px]">{chapter.title}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDownloadPDF}
              className="text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all rounded-xl"
              title="Download"
              data-testid="button-download-md"
            >
              <Download className="w-4 h-4" />
            </Button>

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-white/5 backdrop-blur-sm">
              <BookMarked className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-slate-400 font-mono">
                {currentGlobalIndex + 1}<span className="text-slate-600">/</span>{totalChapters}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowWhatsNew(true)}
              className="text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 relative transition-all rounded-xl"
              title="What's New"
              data-testid="button-whats-new"
            >
              <Sparkles className="w-4 h-4" />
              {newUpdatesSinceVisit.length > 0 && !hasSeenUpdates && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
              )}
            </Button>
            
            <Link href="/veil">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all rounded-xl" data-testid="button-home">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {(speechSupported || useAIVoice) && (
        <div className="fixed top-[52px] left-0 right-0 z-40">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl border-b border-purple-500/10" />
          <div className="container mx-auto px-4 py-2 relative z-10">
            <div className="flex items-center justify-center gap-5">
              {isLoading ? (
                <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-purple-300">Loading audio...</span>
                </div>
              ) : isPlaying ? (
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300, 450].map((delay, i) => (
                      <motion.div
                        key={i}
                        className={`w-1 rounded-full ${i % 2 === 0 ? 'bg-purple-400' : 'bg-cyan-400'}`}
                        animate={{ height: [10, 18, 10] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">Now playing</span>
                  <Button 
                    size="icon" 
                    onClick={handlePause}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-full min-w-[48px] min-h-[48px] w-12 h-12 shadow-lg shadow-cyan-500/30"
                    data-testid="button-pause-chapter"
                    title="Pause"
                  >
                    <Pause className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={handleStop}
                    className="bg-slate-700 hover:bg-slate-600 text-white rounded-full min-w-[48px] min-h-[48px] w-12 h-12 border border-slate-600"
                    data-testid="button-stop-chapter"
                    title="Stop"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Button 
                    size="icon" 
                    onClick={handlePlay}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-full min-w-[48px] min-h-[48px] w-12 h-12 shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 hover:scale-105"
                    data-testid="button-play-chapter"
                    title={isPaused ? 'Resume' : (useAIVoice ? 'Listen with AI Voice' : 'Listen (Browser Voice)')}
                  >
                    <Play className="w-5 h-5 ml-0.5" />
                  </Button>
                  <span className="text-xs text-slate-500 hidden sm:inline">{isPaused ? 'Paused — tap to resume' : 'Listen to this chapter'}</span>
                  {isPaused && (
                    <Button 
                      size="icon" 
                      onClick={handleStop}
                      className="bg-slate-700 hover:bg-slate-600 text-white rounded-full min-w-[48px] min-h-[48px] w-12 h-12 border border-slate-600"
                      data-testid="button-stop-paused"
                      title="Stop"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          {ttsError && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`mx-4 mb-2 p-3 backdrop-blur-xl border rounded-xl shadow-2xl z-[200] text-xs relative ${voicePermanentFail ? 'bg-red-950/95 border-red-500/30' : 'bg-slate-900/95 border-purple-500/30'}`}
            >
              <button 
                onClick={() => { setTtsError(null); if (voicePermanentFail) setVoicePermanentFail(false); }} 
                className="absolute top-1 right-2 text-white/40 hover:text-white text-lg"
                data-testid="button-dismiss-tts-error"
              >
                &times;
              </button>
              <p className="text-white/80 mb-2 pr-4">{ttsError}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setTtsError(null); handleDownloadPDF(); }} 
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors text-[10px]"
                  data-testid="button-tts-error-pdf"
                >
                  Download PDF
                </button>
                <a href="/veil" className="text-purple-400 hover:text-purple-300 underline transition-colors text-[10px]">Download page</a>
                {voicePermanentFail && (
                  <button 
                    onClick={() => { setVoicePermanentFail(false); setTtsError(null); }}
                    className="text-purple-400 hover:text-purple-300 underline transition-colors text-[10px]"
                  >
                    Try again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showWhatsNew && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={() => { setShowWhatsNew(false); setHasSeenUpdates(true); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-lg max-h-[80vh] overflow-auto px-4"
            >
              <GlassCard glow className="p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center shadow-sm shadow-purple-500/10">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">What's New</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowWhatsNew(false); setHasSeenUpdates(true); }}
                    className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mb-5 relative z-10">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 backdrop-blur-sm">
                    <Crown className="w-3 h-3 mr-1" />
                    v{CURRENT_VERSION}
                  </Badge>
                </div>
                
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 relative z-10">
                  {EBOOK_CHANGELOG.map((entry, i) => (
                    <motion.div 
                      key={entry.version}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-xl p-4 transition-all ${
                        i < newUpdatesSinceVisit.length 
                          ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/5 border border-cyan-500/20 shadow-sm shadow-cyan-500/5' 
                          : 'bg-slate-900/40 border border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm text-white font-medium">v{entry.version}</span>
                        <span className="text-xs text-slate-500">{entry.date}</span>
                      </div>
                      <ul className="space-y-2">
                        {entry.updates.map((update, j) => (
                          <li key={j} className="text-sm">
                            <div className="text-left w-full p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mr-2 uppercase tracking-wider ${
                                update.type === 'added' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                update.type === 'updated' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                'bg-red-500/20 text-red-400 border border-red-500/20'
                              }`}>
                                {update.type}
                              </span>
                              <span className="text-slate-300 text-xs leading-relaxed">{update.description}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-5 pt-5 border-t border-white/5 relative z-10">
                  <Button
                    onClick={() => { setShowWhatsNew(false); setHasSeenUpdates(true); }}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all py-5"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Continue Reading
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 overflow-y-auto"
            >
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl border-r border-purple-500/15" />
              <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-purple-500/30 via-cyan-500/20 to-purple-500/30" />
              
              <div className="relative z-10">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
                      <ScrollText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Contents</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em]">{totalChapters} chapters</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white hover:bg-purple-500/10 rounded-xl">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="py-3">
                  {toc.map((vol, volIndex) => (
                    <div key={vol.id} className="px-3 py-2">
                      <div className="flex items-center gap-2 mb-2 px-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 shadow-sm shadow-purple-500/30" />
                        <h3 className="font-semibold text-[10px] uppercase tracking-[0.15em] bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                          {vol.title}
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-600 mb-2 px-2">{vol.subtitle}</p>
                      
                      <div className="space-y-0.5">
                        {vol.chapters.map((chap, chapIndex) => {
                          const isActive = currentVolume === volIndex && currentChapter === chapIndex;
                          const globalIdx = getGlobalChapterIndex(volIndex, chapIndex);
                          const isLocked = isPreviewOnly && globalIdx >= FREE_PREVIEW_CHAPTERS;
                          return (
                            <motion.button
                              key={chap.id}
                              onClick={() => goToChapter(volIndex, chapIndex)}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                                isLocked
                                  ? 'text-slate-600 cursor-not-allowed opacity-50'
                                  : isActive
                                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/10 text-white border border-purple-500/25 shadow-md shadow-purple-500/10'
                                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                              }`}
                              data-testid={`chapter-nav-${volIndex}-${chapIndex}`}
                              whileHover={{ x: (isActive || isLocked) ? 0 : 4 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="flex items-center gap-2.5">
                                {isActive && !isLocked && (
                                  <motion.div 
                                    className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-400 to-cyan-400 flex-shrink-0 shadow-sm shadow-purple-500/30"
                                    layoutId="activeChapterIndicator"
                                  />
                                )}
                                {isLocked && (
                                  <Lock className="w-3 h-3 text-slate-600 flex-shrink-0" />
                                )}
                                <span className={`text-xs leading-snug ${isActive ? 'font-medium' : ''}`}>{chap.title}</span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-white/5 mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-purple-400" />
                      Progress
                    </span>
                    <span className="font-mono text-purple-400 font-medium">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-full shadow-sm shadow-purple-500/30"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/[0.04] rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-32 w-80 h-80 bg-cyan-500/[0.03] rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      <div className={`${(speechSupported || useAIVoice) ? 'pt-28' : 'pt-20'} pb-28 px-4 sm:px-6 md:px-8 relative z-10`}>
        {(chapterLoading || !chapter) ? (
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20">
            <div className="relative w-14 h-14 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-t-purple-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" />
              <BookOpen className="absolute inset-0 m-auto w-6 h-6 text-purple-400" />
            </div>
            <p className="text-slate-400 text-sm">Loading chapter...</p>
          </div>
        ) : (
        <motion.div
          key={`${currentVolume}-${currentChapter}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <div className="mb-12 sm:mb-16 pt-6 sm:pt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <Badge variant="outline" className="border-purple-500/20 text-purple-400 backdrop-blur-sm text-[10px] uppercase tracking-[0.15em]">
                <Feather className="w-3 h-3 mr-1.5" />
                {volume.title}
              </Badge>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center leading-tight" data-testid="chapter-title">
              {chapter.title}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="w-10 h-px bg-gradient-to-r from-transparent to-purple-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 shadow-sm shadow-purple-500/30" />
              <div className="w-10 h-px bg-gradient-to-l from-transparent to-cyan-500/50" />
            </div>
          </div>

          <GlassCard className="p-5 sm:p-8 md:p-10 lg:p-14 relative overflow-hidden" glow>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 prose prose-invert prose-lg max-w-none 
              prose-p:text-slate-300 prose-p:leading-[1.95] prose-p:mb-7 prose-p:text-[16px] sm:prose-p:text-[17px]
              prose-headings:text-white
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-12 sm:prose-h2:mt-14 prose-h2:mb-6 sm:prose-h2:mb-7 prose-h2:font-bold
              prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-10 sm:prose-h3:mt-12 prose-h3:mb-4 sm:prose-h3:mb-5 prose-h3:text-purple-300
              prose-strong:text-white prose-strong:font-semibold
              prose-em:text-purple-200/90
              prose-ul:text-slate-300 prose-ul:space-y-2
              prose-ol:text-slate-300 prose-ol:space-y-2
              prose-li:text-slate-300 prose-li:leading-relaxed prose-li:text-[16px] sm:prose-li:text-[17px]
              prose-blockquote:border-l-2 prose-blockquote:border-l-purple-500/60 prose-blockquote:bg-purple-500/5 prose-blockquote:px-4 sm:prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-xl
              prose-blockquote:text-slate-200 prose-blockquote:italic prose-blockquote:not-italic prose-blockquote:text-[16px] sm:prose-blockquote:text-[17px] prose-blockquote:backdrop-blur-sm prose-blockquote:border prose-blockquote:border-purple-500/10
              prose-hr:border-purple-500/20 prose-hr:my-10
              prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 prose-a:transition-colors
              prose-code:text-cyan-300 prose-code:bg-slate-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:border prose-code:border-slate-700/50
              prose-img:rounded-xl prose-img:border prose-img:border-purple-500/20 prose-img:shadow-xl prose-img:shadow-purple-500/10
              [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:bg-gradient-to-b [&>p:first-of-type]:first-letter:from-purple-300 [&>p:first-of-type]:first-letter:to-cyan-400 [&>p:first-of-type]:first-letter:bg-clip-text [&>p:first-of-type]:first-letter:text-transparent [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1 [&>p:first-of-type]:first-letter:leading-none
            ">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                  h2: ({ node, children, ...props }) => (
                    <h2 {...props} className="flex items-center gap-3 not-prose">
                      <div className="w-1 h-7 rounded-full bg-gradient-to-b from-purple-400 to-cyan-500 flex-shrink-0 shadow-sm shadow-purple-500/20" />
                      <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-200 to-cyan-200 bg-clip-text text-transparent mt-12 sm:mt-14 mb-6 sm:mb-7">{children}</span>
                    </h2>
                  ),
                  h3: ({ node, children, ...props }) => (
                    <h3 {...props} className="not-prose text-lg sm:text-xl font-semibold text-purple-300 mt-10 sm:mt-12 mb-4 sm:mb-5 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-purple-400/60 flex-shrink-0" />
                      {children}
                    </h3>
                  ),
                  a: ({ node, children, href, ...props }) => {
                    if (href && href.startsWith('#')) {
                      return (
                        <a
                          {...props}
                          href={href}
                          className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 hover:decoration-cyan-400/60 transition-all cursor-pointer"
                          data-testid={`link-internal-${href.slice(1)}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigateToInternalLink(href);
                          }}
                        >
                          {children}
                        </a>
                      );
                    }
                    return (
                      <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/30 transition-colors">
                        {children}
                      </a>
                    );
                  },
                  blockquote: ({ node, children, ...props }) => (
                    <blockquote {...props} className="not-prose border-l-2 border-l-purple-500/60 bg-gradient-to-r from-purple-500/5 to-transparent backdrop-blur-sm px-4 sm:px-5 py-4 rounded-r-xl my-6 border border-purple-500/10">
                      <div className="text-slate-200 italic text-[16px] sm:text-[17px] leading-relaxed">{children}</div>
                    </blockquote>
                  ),
                  img: ({ node, ...props }) => (
                    <figure className="my-8 flex flex-col items-center not-prose">
                      <div className="bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-purple-500/20 shadow-xl shadow-purple-500/5 max-w-lg w-full">
                        <img {...props} className="w-full rounded-lg" loading="lazy" />
                        {props.alt && (
                          <p className="text-center text-sm text-slate-400 mt-3 italic">{props.alt}</p>
                        )}
                      </div>
                    </figure>
                  ),
                  hr: () => (
                    <div className="my-10 sm:my-12 flex items-center justify-center gap-3 not-prose">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/30" />
                      <div className="flex gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-purple-400/60" />
                        <div className="w-1 h-1 rounded-full bg-cyan-400/60" />
                        <div className="w-1 h-1 rounded-full bg-purple-400/60" />
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/30" />
                    </div>
                  ),
                }}
              >
                {chapter.content}
              </ReactMarkdown>
            </div>
          </GlassCard>

          {isPreviewOnly && currentChapter >= FREE_PREVIEW_CHAPTERS - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 sm:mt-14"
            >
              <GlassCard glow>
                <div className="p-6 sm:p-10 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-purple-500/30">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                      You've reached the end of the preview
                    </h3>
                    <p className="text-white/50 max-w-md mx-auto mb-2 text-sm">
                      You've read the first {FREE_PREVIEW_CHAPTERS} chapters. The full book contains 52 chapters across 13 parts — 107,000 words of investigation. Purchase to continue reading.
                    </p>
                    <p className="text-white/30 text-xs mb-6">
                      Available on Amazon for $9.99 — or get it here for half price.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                      <Button
                        size="lg"
                        disabled={purchaseLoading || !userId}
                        onClick={async () => {
                          if (!userId) return;
                          setPurchaseLoading(true);
                          try {
                            const res = await fetch('/api/ebook/checkout', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bookId: 'through-the-veil', userId }),
                            });
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            }
                          } catch (err) {
                            console.error('Checkout error:', err);
                          } finally {
                            setPurchaseLoading(false);
                          }
                        }}
                        className="h-14 px-8 text-base gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-2xl shadow-purple-500/25 rounded-xl"
                        data-testid="button-purchase-ebook"
                      >
                        {purchaseLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                        Unlock Full Book — $4.99
                      </Button>
                    </div>
                    {!userId && (
                      <p className="text-purple-400/70 text-xs">
                        Sign in to purchase the full book
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-4 text-xs text-white/30">
                      <span>52 chapters</span>
                      <span>·</span>
                      <span>13 parts</span>
                      <span>·</span>
                      <span>107K words</span>
                      <span>·</span>
                      <span>AI narration included</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {!(isPreviewOnly && currentChapter >= FREE_PREVIEW_CHAPTERS - 1) && (
            <>
              <div className="mt-10 sm:mt-14 flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/20" />
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/20" />
              </div>

              <div className="mt-8 sm:mt-10 flex items-center justify-between gap-4 max-w-xl mx-auto">
                {hasPrev ? (
                  <motion.button
                    onClick={goPrev}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group min-h-[44px]"
                    whileHover={{ x: -4 }}
                    data-testid="button-prev-inline"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors hidden sm:inline">Previous</span>
                  </motion.button>
                ) : <div />}
                {hasNext ? (
                  <motion.button
                    onClick={goNext}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/5 border border-purple-500/20 hover:border-purple-500/40 hover:from-purple-500/15 hover:to-cyan-500/10 transition-all group min-h-[44px]"
                    whileHover={{ x: 4 }}
                    data-testid="button-next-inline"
                  >
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors hidden sm:inline">Next Chapter</span>
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                  </motion.button>
                ) : <div />}
              </div>
            </>
          )}
        </motion.div>
        )}
      </div>

      <AnimatePresence>
        {returnPosition && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => {
              const pos = returnPosition;
              setReturnPosition(null);
              setCurrentVolume(pos.vol);
              setCurrentChapter(pos.chap);
              setSidebarOpen(false);
              setTimeout(() => window.scrollTo(0, pos.scrollY), 100);
            }}
            className="fixed bottom-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 backdrop-blur-xl shadow-lg shadow-cyan-500/10 hover:border-cyan-400/50 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all min-h-[44px]"
            data-testid="button-return-to-reading"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Return to reading</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl border-t border-purple-500/15" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="container mx-auto px-4 py-2.5 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={!hasPrev}
              className="text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 disabled:opacity-20 transition-all min-w-[80px] sm:min-w-[100px] justify-start rounded-xl"
              data-testid="button-prev-chapter"
            >
              <ChevronLeft className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="hidden sm:inline text-sm">Previous</span>
            </Button>

            <div className="flex-1 max-w-md mx-auto flex flex-col items-center gap-1.5">
              <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-full shadow-sm shadow-purple-500/30"
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-purple-400" />
                {progressPercent}% complete
              </span>
            </div>

            <Button
              variant="ghost"
              onClick={goNext}
              disabled={!hasNext}
              className="text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 disabled:opacity-20 transition-all min-w-[80px] sm:min-w-[100px] justify-end rounded-xl"
              data-testid="button-next-chapter"
            >
              <span className="hidden sm:inline text-sm">Next</span>
              <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
