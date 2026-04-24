import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Send, Volume2, VolumeX, Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Default to hidden, check localStorage for explicit "show" preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai-assistant-minimized') !== 'false';
    }
    return true;
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your Trust Layer assistant. Ask me anything about the ecosystem, check your portfolio, or get help navigating. You can type or use voice!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const windowAny = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance };
    if (windowAny.webkitSpeechRecognition || windowAny.SpeechRecognition) {
      const SpeechRecognitionClass = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        recognitionRef.current = new SpeechRecognitionClass();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
          handleSend(transcript);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast({
            title: "Voice Error",
            description: "Could not understand. Please try again.",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakText = async (text: string) => {
    if (!voiceEnabled) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    try {
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch {
      setIsSpeaking(false);
      // Fallback to browser TTS if OpenAI fails
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const messageText = overrideMessage || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      if (voiceEnabled) {
        speakText(data.response);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMinimized = () => {
    const newValue = !isMinimized;
    setIsMinimized(newValue);
    localStorage.setItem('ai-assistant-minimized', String(newValue));
    if (newValue) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Minimized tab on the edge */}
      <AnimatePresence>
        {isMinimized && (
          <motion.button
            className="fixed bottom-32 right-0 z-50 bg-gradient-to-l from-cyan-500 to-purple-500 text-white px-2 py-4 rounded-l-lg shadow-lg"
            onClick={toggleMinimized}
            initial={{ x: 50 }}
            animate={{ x: 0 }}
            exit={{ x: 50 }}
            whileHover={{ x: -4 }}
            data-testid="button-ai-assistant-minimized"
            aria-label="Show AI Assistant"
          >
            <div className="flex flex-col items-center gap-1">
              <img 
                src="/icons/icon-192x192.png" 
                alt="AI" 
                className="w-6 h-6 rounded-full"
              />
              <span className="text-[10px] font-bold writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>AI</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main floating button - docked on right edge */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.button
            className="fixed bottom-32 right-0 z-50 bg-gradient-to-l from-cyan-500 to-purple-500 text-white px-2 py-4 rounded-l-lg shadow-lg"
            onClick={() => setIsOpen(!isOpen)}
            onContextMenu={(e) => { e.preventDefault(); toggleMinimized(); }}
            initial={{ x: 50 }}
            animate={{ x: 0 }}
            exit={{ x: 50 }}
            whileHover={{ x: -4 }}
            data-testid="button-ai-assistant"
            aria-label="Open AI Assistant"
          >
            <div className="flex flex-col items-center gap-1">
              <img 
                src="/icons/icon-192x192.png" 
                alt="Trust Layer AI" 
                className="w-8 h-8 rounded-full"
              />
              {isOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <span className="text-[10px] font-bold" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>AI</span>
              )}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-48 right-0 z-50 w-[360px] max-w-[calc(100vw-16px)] h-[400px] max-h-[60vh] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-l-2xl shadow-[0_0_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.2 }}
            data-testid="ai-assistant-panel"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-500/50">
                  <img 
                    src="/icons/icon-192x192.png" 
                    alt="Trust Layer AI" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Trust Layer AI</h3>
                  <p className="text-[10px] text-cyan-400">Your ecosystem guide</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  data-testid="button-toggle-voice"
                  title={voiceEnabled ? "Mute voice" : "Enable voice"}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0"
                  onClick={toggleMinimized}
                  data-testid="button-minimize-assistant"
                  title="Hide to side"
                >
                  <Minimize2 className="w-4 h-4 text-gray-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-assistant"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                        : "bg-white/10 text-gray-200"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-[9px] opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </motion.div>
              )}
              {isSpeaking && (
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Volume2 className="w-3 h-3" />
                    <span className="text-[10px]">Speaking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-black/30">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isListening ? "default" : "outline"}
                  className={`w-10 h-10 p-0 rounded-full ${
                    isListening 
                      ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                      : "border-white/20 hover:border-cyan-500/50"
                  }`}
                  onClick={toggleListening}
                  data-testid="button-voice-input"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask anything..."}
                  className="flex-1 bg-white/5 border-white/10 focus:border-cyan-500/50"
                  disabled={isListening}
                  data-testid="input-assistant-message"
                />
                <Button
                  size="sm"
                  className="w-10 h-10 p-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center mt-2">
                Press mic to speak or type your question
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

