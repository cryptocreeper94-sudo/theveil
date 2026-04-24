import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ShieldCheck, ArrowLeft, CheckCircle, XCircle, Clock,
  User, Globe, Calendar, AlertTriangle, Loader2, Search, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

interface KycVerification {
  id: string;
  userId: string;
  status: string;
  fullName: string | null;
  country: string | null;
  verificationType: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
}

function KycCard({ kyc, onApprove, onReject }: { 
  kyc: KycVerification; 
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const statusColors = {
    pending: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    not_started: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    approved: <CheckCircle className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />,
    not_started: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
      style={{ boxShadow: "0 0 30px rgba(0,200,255,0.05)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
            <User className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{kyc.fullName || "No name provided"}</h3>
            <p className="text-sm text-gray-400">{kyc.userEmail || kyc.userId}</p>
          </div>
        </div>
        <Badge className={statusColors[kyc.status as keyof typeof statusColors] || statusColors.not_started}>
          {statusIcons[kyc.status as keyof typeof statusIcons]}
          <span className="ml-1 capitalize">{kyc.status}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-xs">Country</span>
          </div>
          <p className="text-white font-medium">{kyc.country || "Not specified"}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">Submitted</span>
          </div>
          <p className="text-white font-medium">
            {new Date(kyc.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {kyc.rejectionReason && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">
            <strong>Rejection reason:</strong> {kyc.rejectionReason}
          </p>
        </div>
      )}

      {kyc.status === "pending" && (
        <div className="flex gap-2">
          <Button
            onClick={() => onApprove(kyc.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            data-testid={`button-approve-kyc-${kyc.id}`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
          
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-testid={`button-reject-kyc-${kyc.id}`}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Reject KYC Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-gray-400">Reason for rejection</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    className="mt-1 bg-slate-800/50 border-white/10"
                  />
                </div>
                <Button
                  onClick={() => {
                    onReject(kyc.id, rejectionReason);
                    setRejectOpen(false);
                    setRejectionReason("");
                  }}
                  disabled={!rejectionReason}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Confirm Rejection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </motion.div>
  );
}

export default function KycAdmin() {
  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (!auth) window.location.href = "/owner-admin";
  }, []);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getOwnerHeaders = () => ({
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
  });

  const { data: kycList, isLoading } = useQuery<KycVerification[]>({
    queryKey: ["/api/owner/kyc"],
    queryFn: async () => {
      const res = await fetch("/api/owner/kyc", {
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch KYC list");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/owner/kyc/${id}/approve`, {
        method: "POST",
        headers: { ...getOwnerHeaders(), "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/kyc"] });
      toast({ title: "KYC Approved", description: "User has been verified" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve KYC", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/owner/kyc/${id}/reject`, {
        method: "POST",
        headers: { ...getOwnerHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/kyc"] });
      toast({ title: "KYC Rejected", description: "User has been notified" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject KYC", variant: "destructive" });
    },
  });

  const filteredKyc = (kycList || []).filter((kyc) => {
    const matchesSearch = !searchQuery || 
      kyc.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || kyc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: kycList?.length || 0,
    pending: kycList?.filter(k => k.status === "pending").length || 0,
    approved: kycList?.filter(k => k.status === "approved").length || 0,
    rejected: kycList?.filter(k => k.status === "rejected").length || 0,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #8b5cf6, #06b6d4)" size={600} top="-10%" left="-10%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={500} top="50%" left="70%" delay={2} />


      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/owner-admin">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                  KYC Verification
                </span>
              </h1>
              <p className="text-gray-400">Review and approve identity verifications</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "cyan" },
            { label: "Pending", value: stats.pending, color: "purple" },
            { label: "Approved", value: stats.approved, color: "green" },
            { label: "Rejected", value: stats.rejected, color: "red" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4"
            >
              <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900/50 border-white/10"
              data-testid="input-search-kyc"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status 
                  ? "bg-purple-600 hover:bg-purple-700" 
                  : "border-white/10 text-gray-400 hover:text-white"
                }
                data-testid={`button-filter-${status}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : filteredKyc.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-gray-400">
              {statusFilter === "pending" 
                ? "No pending verifications" 
                : "No KYC applications found"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKyc.map((kyc) => (
              <KycCard
                key={kyc.id}
                kyc={kyc}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-400 mb-1">Development Mode</h4>
              <p className="text-sm text-gray-400">
                This is a manual approval system. For production, integrate with a third-party KYC provider 
                like Sumsub, Jumio, or Onfido for automated identity verification.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
