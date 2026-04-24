import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Twitter, Facebook, Link, MessageCircle, Mail, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  hashtags?: string[];
}

export function SocialShare({ title, text, url = window.location.href, hashtags = ["DarkWave", "SIG", "Blockchain"] }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(text);
  const shareTitle = encodeURIComponent(title);
  const hashtagStr = hashtags.join(",");

  const shareLinks = [
    {
      name: "Twitter/X",
      icon: Twitter,
      color: "hover:bg-sky-500/20 hover:text-sky-400",
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}&hashtags=${hashtagStr}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-blue-500/20 hover:text-blue-400",
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`,
    },
    {
      name: "Telegram",
      icon: MessageCircle,
      color: "hover:bg-cyan-500/20 hover:text-cyan-400",
      url: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "hover:bg-purple-500/20 hover:text-purple-400",
      url: `mailto:?subject=${shareTitle}&body=${shareText}%0A%0A${shareUrl}`,
    },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link Copied", description: "Share link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNativeShare}
        className="gap-2"
        data-testid="button-share"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
              data-testid="share-overlay"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute right-0 top-full mt-2 w-72 bg-card border border-white/10 rounded-xl shadow-xl z-50 p-4"
              data-testid="share-modal"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Share</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)} data-testid="button-close-share">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${link.color}`}
                    data-testid={`link-share-${link.name.toLowerCase()}`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="text-[10px]">{link.name}</span>
                  </a>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-black/30 rounded-lg px-3 py-2 text-xs text-muted-foreground truncate">
                  <Link className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{url}</span>
                </div>
                <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0" data-testid="button-copy-link">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ShareTransaction({ hash, type, amount, token }: { hash: string; type: string; amount: string; token: string }) {
  return (
    <SocialShare
      title={`Trust Layer ${type} Transaction`}
      text={`I just ${type.toLowerCase()}ed ${amount} ${token} on Trust Layer! Check it out:`}
      url={`${window.location.origin}/explorer?tx=${hash}`}
      hashtags={["DarkWave", "SIG", "Crypto", type]}
    />
  );
}

export function ShareNFT({ name, collection }: { name: string; collection: string }) {
  return (
    <SocialShare
      title={`${name} - Trust Layer NFT`}
      text={`Check out this amazing NFT "${name}" from the ${collection} collection on Trust Layer!`}
      hashtags={["DarkWave", "NFT", "DigitalArt"]}
    />
  );
}

export function ShareAchievement({ title, description }: { title: string; description: string }) {
  return (
    <SocialShare
      title={`Achievement Unlocked: ${title}`}
      text={`I just earned the "${title}" achievement on Trust Layer! ${description}`}
      hashtags={["DarkWave", "Achievement", "Crypto"]}
    />
  );
}
