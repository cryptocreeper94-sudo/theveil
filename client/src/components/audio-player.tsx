import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music, ChevronUp, ChevronDown, Pause, Play, MapPin, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AmbientAudioEngine, AmbientAudioState, getAvailableLocations } from "@/lib/ambient-audio-engine";

interface AmbientAudioControllerProps {
  era: string;
  location: string;
  isNight?: boolean;
}

export function AmbientAudioController({ era, location, isNight = false }: AmbientAudioControllerProps) {
  const engineRef = useRef<AmbientAudioEngine | null>(null);
  const [state, setState] = useState<AmbientAudioState>({
    isPlaying: false,
    isMuted: false,
    masterVolume: 0.5,
    currentLocation: "",
    currentEra: "",
    locationName: "Unknown",
    locationEmoji: "🔇",
    layerCount: 0,
    isNight: false,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AmbientAudioEngine((newState) => {
        setState(newState);
      });
    }
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && era && location) {
      engineRef.current.setLocation(era, location, isNight);
    }
  }, [era, location, isNight]);

  const togglePlay = useCallback(() => {
    engineRef.current?.togglePlay();
  }, []);

  const toggleMute = useCallback(() => {
    engineRef.current?.toggleMute();
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    engineRef.current?.setMasterVolume(value[0]);
  }, []);

  const switchLocation = useCallback((locId: string) => {
    engineRef.current?.setLocation(era, locId, isNight);
    setShowLocationPicker(false);
  }, [era, isNight]);

  const locations = getAvailableLocations(era);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-40"
      style={{ maxWidth: "280px" }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        <div
          className="flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="ambient-audio-toggle"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            state.isPlaying
              ? "bg-gradient-to-r from-cyan-500/30 to-purple-500/30 shadow-lg shadow-cyan-500/10"
              : "bg-slate-800/80"
          }`}>
            {state.isPlaying ? (
              <div className="relative">
                <Music className="w-4 h-4 text-cyan-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              </div>
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{state.locationEmoji}</span>
              <p className="text-xs font-medium text-white truncate">{state.locationName}</p>
            </div>
            <p className="text-[10px] text-slate-500">
              {state.isPlaying
                ? `${state.layerCount} sound layers active`
                : "Tap to expand"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 ${state.isPlaying ? "text-cyan-400" : "text-slate-500"}`}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            data-testid="button-ambient-play"
          >
            {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-700/50"
            >
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-7 w-7 text-slate-400 hover:text-white shrink-0"
                    data-testid="button-ambient-mute"
                  >
                    {state.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </Button>
                  <Slider
                    value={[state.isMuted ? 0 : state.masterVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                    data-testid="slider-ambient-volume"
                  />
                  <span className="text-[10px] text-slate-500 w-7 text-right shrink-0">
                    {Math.round(state.masterVolume * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {state.isNight ? (
                      <Moon className="w-3 h-3 text-purple-400" />
                    ) : (
                      <Sun className="w-3 h-3 text-teal-400" />
                    )}
                    <span className="text-[10px] text-slate-500">
                      {state.isNight ? "Night Mode" : "Day Mode"}
                    </span>
                  </div>
                  <Badge className="bg-slate-800/80 text-slate-400 text-[9px] border-slate-700/50">
                    {state.currentEra || era}
                  </Badge>
                </div>

                <div>
                  <button
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                    data-testid="button-location-picker"
                  >
                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 flex-1">Change Location</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showLocationPicker ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showLocationPicker && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-1.5 space-y-0.5 overflow-hidden"
                      >
                        {locations.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => switchLocation(loc.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-left min-h-[36px] ${
                              state.currentLocation === loc.id
                                ? "bg-cyan-500/10 border border-cyan-500/20"
                                : "hover:bg-slate-800/60"
                            }`}
                            data-testid={`btn-location-${loc.id}`}
                          >
                            <span className="text-base">{loc.emoji}</span>
                            <span className={`text-xs ${state.currentLocation === loc.id ? "text-cyan-400 font-medium" : "text-slate-400"}`}>
                              {loc.name}
                            </span>
                            {state.currentLocation === loc.id && (
                              <span className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface AudioPlayerProps {
  audioPreference: string;
  audioMood: string;
  compact?: boolean;
}

export function AudioPlayer({ audioPreference, audioMood, compact = false }: AudioPlayerProps) {
  if (audioPreference === "silent") return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
          <Music className="w-3 h-3 mr-1" />
          Ambient Audio
        </Badge>
      </div>
    );
  }

  return null;
}

export function AudioPlayerCompact({ audioPreference, audioMood }: AudioPlayerProps) {
  return <AudioPlayer audioPreference={audioPreference} audioMood={audioMood} compact />;
}
