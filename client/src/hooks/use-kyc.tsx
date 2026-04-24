import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";

export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export interface KycVerification {
  id: string;
  userId: string;
  status: KycStatus;
  fullName?: string;
  country?: string;
  verificationType?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export function useKyc() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: kycData, isLoading, refetch } = useQuery({
    queryKey: ["kyc-status", user?.id],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/kyc/status");
        return response.data as { kyc: KycVerification | null };
      } catch (error) {
        return { kyc: null };
      }
    },
    enabled: !!user?.id,
  });
  
  const submitKyc = useMutation({
    mutationFn: async (data: { fullName: string; country: string; verificationType: string }) => {
      const response = await axios.post("/api/kyc/submit", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-status", user?.id] });
    },
  });
  
  const kycStatus: KycStatus = kycData?.kyc?.status || 'not_started';
  const isKycVerified = kycStatus === 'verified';
  const isKycPending = kycStatus === 'pending';
  const isKycRejected = kycStatus === 'rejected';
  
  return {
    kyc: kycData?.kyc,
    kycStatus,
    isKycVerified,
    isKycPending,
    isKycRejected,
    isLoading,
    submitKyc,
    refetch,
  };
}

export function useKycGate(requiredForAction: string) {
  const { kycStatus, isKycVerified, isLoading } = useKyc();
  const { user } = useAuth();
  
  const canProceed = isKycVerified || !user;
  const needsKyc = user && !isKycVerified && !isLoading;
  
  return {
    canProceed,
    needsKyc,
    kycStatus,
    isLoading,
    message: needsKyc 
      ? `KYC verification required for ${requiredForAction}. Complete verification to proceed.`
      : undefined,
  };
}
