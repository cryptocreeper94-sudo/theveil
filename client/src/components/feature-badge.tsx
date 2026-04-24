import { getFeature, getStatusBadgeColor, getStatusLabel, type FeatureStatus } from "@shared/feature-flags";
import { Clock, Sparkles, TestTube, Wrench, Zap } from "lucide-react";

interface FeatureBadgeProps {
  featureId?: string;
  status?: FeatureStatus;
  showTimeline?: boolean;
  className?: string;
}

export function FeatureBadge({ featureId, status, showTimeline = false, className = "" }: FeatureBadgeProps) {
  const feature = featureId ? getFeature(featureId) : undefined;
  const displayStatus = status || feature?.status || 'coming_soon';
  const badgeColor = getStatusBadgeColor(displayStatus);
  const label = getStatusLabel(displayStatus);
  
  const StatusIcon = () => {
    switch (displayStatus) {
      case 'live':
        return <Zap className="w-3 h-3" />;
      case 'beta':
        return <Sparkles className="w-3 h-3" />;
      case 'testnet':
        return <TestTube className="w-3 h-3" />;
      case 'coming_soon':
        return <Clock className="w-3 h-3" />;
      case 'maintenance':
        return <Wrench className="w-3 h-3" />;
      default:
        return null;
    }
  };
  
  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${badgeColor}`}>
        <StatusIcon />
        {label}
      </span>
      {showTimeline && feature?.launchQuarter && displayStatus === 'coming_soon' && (
        <span className="text-[10px] text-muted-foreground">
          Expected: {feature.launchQuarter}
        </span>
      )}
    </div>
  );
}

interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ featureId, children, fallback }: FeatureGateProps) {
  const feature = getFeature(featureId);
  
  if (!feature?.enabled) {
    return fallback || null;
  }
  
  return <>{children}</>;
}

interface ComingSoonOverlayProps {
  featureId?: string;
  title?: string;
  expectedLaunch?: string;
  children: React.ReactNode;
}

export function ComingSoonOverlay({ featureId, title, expectedLaunch, children }: ComingSoonOverlayProps) {
  const feature = featureId ? getFeature(featureId) : undefined;
  const displayTitle = title || feature?.name || 'Feature';
  const displayLaunch = expectedLaunch || feature?.launchQuarter || 'Soon';
  
  return (
    <div className="relative group">
      <div className="opacity-50 pointer-events-none filter grayscale">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-center px-4">
          <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="font-semibold text-white">{displayTitle}</p>
          <p className="text-sm text-purple-400">Coming {displayLaunch}</p>
        </div>
      </div>
    </div>
  );
}
