import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, X, Copy, Check, Download, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRDisplayProps {
  address: string;
  chainName?: string;
  size?: number;
}

export function QRDisplay({ address, chainName = "DarkWave", size = 200 }: QRDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && address) {
      generateQRCode();
    }
  }, [isOpen, address]);

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    setQrDataUrl(null);
    
    try {
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: address, size }),
      });
      
      if (response.ok) {
        const { dataUrl } = await response.json();
        setQrDataUrl(dataUrl);
      } else {
        setError("Failed to generate QR code. Please copy the address manually.");
      }
    } catch {
      setError("QR generation unavailable. Please copy the address manually.");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast({ title: "Address Copied", description: "Wallet address copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrDataUrl) {
      copyAddress();
      return;
    }
    
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${chainName.toLowerCase()}-wallet-qr.png`;
    a.click();
    toast({ title: "QR Downloaded", description: "QR code saved as PNG" });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8"
        title="Show QR Code"
        data-testid="button-show-qr"
      >
        <QrCode className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
              data-testid="qr-overlay"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              data-testid="qr-modal"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">{chainName} Wallet</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} data-testid="button-close-qr">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6 flex flex-col items-center">
                {loading ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-white/5 rounded-xl mb-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-3 py-6 mb-4">
                    <AlertCircle className="w-12 h-12 text-purple-500" />
                    <p className="text-sm text-center text-muted-foreground px-4">
                      {error}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateQRCode}
                      className="gap-2"
                      data-testid="button-retry-qr"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </Button>
                  </div>
                ) : qrDataUrl ? (
                  <>
                    <div 
                      className="bg-white p-4 rounded-xl mb-4"
                      data-testid="qr-code"
                    >
                      <img src={qrDataUrl} alt="Wallet QR Code" width={size} height={size} />
                    </div>
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      Scan this QR code to receive funds
                    </p>
                  </>
                ) : null}

                <div className="w-full p-3 bg-black/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="text-xs font-mono break-all" data-testid="text-address">{address}</p>
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t border-white/10">
                <Button variant="outline" className="flex-1 gap-2" onClick={copyAddress} data-testid="button-copy-address">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Address"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2" 
                  onClick={downloadQR} 
                  disabled={!qrDataUrl}
                  data-testid="button-download-qr"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
