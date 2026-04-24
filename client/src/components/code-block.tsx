import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

const languageColors: Record<string, string> = {
  javascript: "text-teal-400",
  typescript: "text-blue-400",
  jsx: "text-cyan-400",
  tsx: "text-cyan-400",
  python: "text-green-400",
  rust: "text-cyan-400",
  solidity: "text-purple-400",
  json: "text-gray-400",
  bash: "text-green-300",
  shell: "text-green-300",
};

export function CodeBlock({ code, language = "typescript", filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightSyntax = (code: string): string => {
    return code
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500">$1</span>')
      .replace(/\b(import|export|from|const|let|var|function|async|await|return|if|else|for|while|class|extends|new|this|try|catch|throw)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-cyan-400">$1</span>')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-green-400">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-cyan-400">$1</span>')
      .replace(/\b(interface|type|enum)\b/g, '<span class="text-blue-400">$1</span>');
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-teal-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-muted-foreground ml-2 font-mono">{filename}</span>
          </div>
          <span className={`text-xs font-mono ${languageColors[language] || "text-gray-400"}`}>
            {language}
          </span>
        </div>
      )}
      
      <div className="relative group">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white transition-all"
          data-testid="button-copy-code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
        
        <pre className="p-4 overflow-x-auto text-sm">
          <code
            className="font-mono leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }}
          />
        </pre>
      </div>
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-white/10 text-primary font-mono text-sm">
      {children}
    </code>
  );
}
