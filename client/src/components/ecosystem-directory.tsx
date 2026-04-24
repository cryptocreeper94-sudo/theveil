import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ChevronUp, ExternalLink, Sparkles } from "lucide-react";

interface DirectoryApp {
  id: string;
  name: string;
  category: string;
  hook: string;
  url?: string;
  featured?: boolean;
}

interface CategoryGroup {
  category: string;
  apps: DirectoryApp[];
}

const CATEGORY_ICONS: Record<string, string> = {
  "Core": "⚡",
  "Security": "🛡️",
  "DeFi": "💎",
  "Finance": "💰",
  "Gaming": "🎮",
  "Entertainment": "🌀",
  "Community": "💬",
  "AI Trading": "🤖",
  "Analytics": "📈",
  "Enterprise": "🏢",
  "Automotive": "🚗",
  "Transportation": "🚚",
  "Services": "🛠️",
  "Hospitality": "☕",
  "Identity": "🆔",
  "Education": "🎓",
  "Publishing": "📖",
  "Development": "⚙️",
  "Outdoor & Recreation": "🌿",
  "Sports & Fitness": "⛳",
  "Health & Wellness": "🧘",
  "Food & Delivery": "🍔",
};

const CATEGORY_ORDER = [
  "Core", "Security", "DeFi", "Finance", "AI Trading", "Analytics",
  "Gaming", "Entertainment", "Community", "Identity", "Education", "Publishing",
  "Development", "Enterprise", "Automotive", "Transportation", "Services",
  "Hospitality", "Outdoor & Recreation", "Sports & Fitness", "Health & Wellness",
  "Food & Delivery",
];

export function EcosystemDirectory({
  compact = false,
  maxCategories,
  className = "",
  defaultCollapsed = false,
}: {
  compact?: boolean;
  maxCategories?: number;
  className?: string;
  defaultCollapsed?: boolean;
}) {
  const [apps, setApps] = useState<DirectoryApp[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ecosystem/directory")
      .then((r) => r.json())
      .then((data) => {
        setApps(data.apps || []);
        if (!compact && !defaultCollapsed) {
          setExpandedCategories(new Set((data.apps || []).map((a: DirectoryApp) => a.category)));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [compact, defaultCollapsed]);

  const grouped: CategoryGroup[] = [];
  const catMap = new Map<string, DirectoryApp[]>();
  for (const app of apps) {
    const list = catMap.get(app.category) || [];
    list.push(app);
    catMap.set(app.category, list);
  }
  for (const cat of CATEGORY_ORDER) {
    if (catMap.has(cat)) {
      grouped.push({ category: cat, apps: catMap.get(cat)! });
    }
  }
  catMap.forEach((appList, cat) => {
    if (!CATEGORY_ORDER.includes(cat)) {
      grouped.push({ category: cat, apps: appList });
    }
  });

  const displayGroups = maxCategories ? grouped.slice(0, maxCategories) : grouped;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedCategories.size === grouped.length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(grouped.map((g) => g.category)));
    }
  };

  if (loading) {
    return (
      <div className={`bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-cyan-500/20 animate-pulse" />
          <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-full bg-white/5 rounded mt-3 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden ${className}`}
      data-testid="ecosystem-directory"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 hover:from-cyan-500/10 hover:to-purple-500/10 transition-all cursor-pointer group"
        data-testid="directory-collapse-toggle"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Ecosystem Directory
          </h3>
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {apps.length} apps
          </span>
        </div>
        <div className="flex items-center gap-2">
          {collapsed && (
            <span className="text-[10px] text-white/30 hidden sm:inline">Click to expand</span>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-end px-5 py-1.5 border-b border-white/[0.03]">
              <button
                onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                className="text-[10px] text-white/40 hover:text-cyan-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                data-testid="directory-toggle-all"
              >
                {expandedCategories.size === grouped.length ? "Collapse All" : "Expand All"}
              </button>
            </div>

            <div className="divide-y divide-white/[0.03]">
              {displayGroups.map((group) => {
                const isOpen = expandedCategories.has(group.category);
                const icon = CATEGORY_ICONS[group.category] || "⚡";

                return (
                  <div key={group.category}>
                    <button
                      onClick={() => toggleCategory(group.category)}
                      className="w-full flex items-center gap-2 px-5 py-2.5 hover:bg-white/[0.02] transition-colors text-left group"
                      data-testid={`directory-category-${group.category.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className="text-sm">{icon}</span>
                      <span className="text-xs font-semibold text-white/70 group-hover:text-white/90 transition-colors flex-1">
                        {group.category}
                      </span>
                      <span className="text-[10px] text-white/30 mr-1">{group.apps.length}</span>
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3 text-white/30" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-white/30" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-2">
                            {group.apps.map((app) => (
                              <a
                                key={app.id}
                                href={app.url || `/${app.id}`}
                                className="flex items-center gap-2 py-1.5 px-3 -mx-1 rounded-lg hover:bg-white/[0.04] transition-colors group/app"
                                data-testid={`directory-app-${app.id}`}
                              >
                                <span className="text-xs font-medium text-cyan-400 group-hover/app:text-cyan-300 transition-colors min-w-0 truncate">
                                  {app.name}
                                </span>
                                {app.featured && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 shadow-[0_0_4px_rgba(6,182,212,0.6)]" />
                                )}
                                {!compact && app.hook && (
                                  <span className="text-[10px] text-white/25 truncate flex-1 text-right">
                                    {app.hook}
                                  </span>
                                )}
                                {app.url && (app.url.startsWith("http") && !app.url.includes(window.location.hostname)) && (
                                  <ExternalLink className="w-2.5 h-2.5 text-white/15 flex-shrink-0" />
                                )}
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
