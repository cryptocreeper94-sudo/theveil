import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface SubscriptionResponse {
  plan: string;
  status: string;
  isActive: boolean;
  isPremium: boolean;
  isWhitelisted: boolean;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  features: string[];
}

interface SubscriptionStatus {
  plan: string;
  isActive: boolean;
  isPremium: boolean;
  isWhitelisted: boolean;
  features: string[];
  isLoading: boolean;
  currentPeriodEnd: string | null;
}

export function useSubscription(): SubscriptionStatus {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<SubscriptionResponse>({
    queryKey: ["/api/subscription/status", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/subscription/status", { credentials: "include" });
      if (!res.ok) {
        return { 
          plan: "free", 
          status: "inactive",
          isActive: false, 
          isPremium: false,
          isWhitelisted: false,
          currentPeriodEnd: null,
          trialEnd: null,
          features: [] 
        };
      }
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  return {
    plan: data?.plan ?? "free",
    isActive: data?.isActive ?? false,
    isPremium: data?.isPremium ?? false,
    isWhitelisted: data?.isWhitelisted ?? false,
    features: data?.features ?? [],
    currentPeriodEnd: data?.currentPeriodEnd ?? null,
    isLoading,
  };
}

export function hasPlanAccess(plan: string, requiredPlans: string[]): boolean {
  if (requiredPlans.length === 0) return true;
  if (plan === "whitelisted") return true;
  if (plan === "complete_bundle" || plan === "complete") return true;
  if (plan === "founder") return true;
  return requiredPlans.includes(plan);
}
