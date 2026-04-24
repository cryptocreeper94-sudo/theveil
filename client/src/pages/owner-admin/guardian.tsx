import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, ShieldCheck, Award, Clock, CheckCircle2, XCircle, Play,
  Search, Download, AlertTriangle, DollarSign, FileText, Sparkles
} from "lucide-react";
import { BackButton } from "@/components/page-nav";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

interface Certification {
  id: string;
  projectName: string;
  projectUrl: string | null;
  contactEmail: string;
  tier: string;
  status: string;
  score: number | null;
  findings: string | null;
  stripePaymentId: string | null;
  userId: string | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

function getTierInfo(tier: string) {
  switch (tier) {
    case "guardian_premier":
      return { name: "Guardian Premier", price: "Custom", gradient: "from-pink-500 to-pink-700", icon: Award };
    case "guardian_certified":
      return { name: "Guardian Certified", price: "$2,499", gradient: "from-purple-500 to-purple-700", icon: ShieldCheck };
    case "guardian_assurance":
    case "assurance_lite":
      return { name: "Guardian Assurance", price: "$499", gradient: "from-blue-500 to-blue-700", icon: ShieldCheck };
    case "guardian_scan":
      return { name: "Guardian Scan", price: "Free", gradient: "from-cyan-500 to-cyan-700", icon: Shield };
    default:
      return { name: "Guardian Scan", price: "Free", gradient: "from-cyan-500 to-cyan-700", icon: Shield };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", label: "Completed" };
    case "in_progress":
      return { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", label: "In Progress" };
    case "review":
      return { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", label: "Expert Review" };
    case "report_generation":
      return { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", label: "Report Generation" };
    case "intake":
      return { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/30", label: "Intake" };
    case "revoked":
      return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", label: "Revoked" };
    default:
      return { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", label: "Pending" };
  }
}

function getNextStatus(current: string): string | null {
  const flow: Record<string, string> = {
    intake: "pending",
    pending: "in_progress",
    in_progress: "review",
    review: "report_generation",
    report_generation: "completed",
  };
  return flow[current] || null;
}

function getNextStatusLabel(current: string): string | null {
  const labels: Record<string, string> = {
    intake: "Start Initial Scan",
    pending: "Begin Deep Analysis",
    in_progress: "Move to Expert Review",
    review: "Generate Report",
    report_generation: "Mark as Delivered",
  };
  return labels[current] || null;
}

export default function OwnerGuardian() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [findingsInput, setFindingsInput] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (auth !== "true") {
      window.location.href = "/owner-admin";
    }
  }, []);

  const getOwnerHeaders = () => ({
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
    "Content-Type": "application/json",
  });

  const { data, isLoading, refetch } = useQuery<{ certifications: Certification[] }>({
    queryKey: ["/api/owner/guardian/certifications"],
    queryFn: async () => {
      const res = await fetch("/api/owner/guardian/certifications", { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch certifications");
      return res.json();
    },
  });

  const certifications = data?.certifications || [];

  const filteredCerts = certifications.filter(cert => {
    const matchesSearch = !searchTerm || 
      cert.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: certifications.length,
    active: certifications.filter(c => !["completed", "revoked"].includes(c.status)).length,
    inProgress: certifications.filter(c => ["in_progress", "review", "report_generation"].includes(c.status)).length,
    completed: certifications.filter(c => c.status === "completed").length,
    revenue: certifications.filter(c => c.stripePaymentId).reduce((sum, c) => {
      if (c.tier === "guardian_premier") return sum + 7500;
      if (c.tier === "guardian_certified") return sum + 2499;
      if (c.tier === "guardian_assurance" || c.tier === "assurance_lite") return sum + 499;
      return sum;
    }, 0),
  };

  const handleAction = async (certId: string, action: "start" | "complete" | "revoke", body?: object) => {
    setProcessing(certId);
    try {
      const res = await fetch(`/api/owner/guardian/certifications/${certId}/${action}`, {
        method: "POST",
        headers: getOwnerHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      toast.success(`Certification ${action === "start" ? "started" : action === "complete" ? "completed" : "revoked"}`);
      refetch();
      setSelectedCert(null);
      setScoreInput("");
      setFindingsInput("");
    } catch (error: any) {
      toast.error(error.message || "Failed to perform action");
    } finally {
      setProcessing(null);
    }
  };

  const handleAdvance = async (certId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;
    setProcessing(certId);
    try {
      const res = await fetch(`/api/owner/guardian/certifications/${certId}/advance`, {
        method: "POST",
        headers: getOwnerHeaders(),
        body: JSON.stringify({ nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to advance");
      }
      toast.success(`Advanced to: ${getStatusBadge(nextStatus).label}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to advance certification");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : "-";

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={600} top="-10%" left="-10%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={500} top="50%" left="70%" delay={2} />
      <GlowOrb color="linear-gradient(135deg, #22c55e, #06b6d4)" size={400} top="80%" left="10%" delay={4} />


      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Guardian Admin
                </span>
              </h1>
              <p className="text-gray-400">Manage security certifications</p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 hover:border-cyan-500/50"
            data-testid="button-refresh"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total", value: stats.total, icon: <Shield className="w-5 h-5 text-cyan-400" />, color: "from-cyan-500/20 to-cyan-500/5" },
            { label: "Active", value: stats.active, icon: <Clock className="w-5 h-5 text-blue-400" />, color: "from-blue-500/20 to-blue-500/5" },
            { label: "In Progress", value: stats.inProgress, icon: <Play className="w-5 h-5 text-purple-400" />, color: "from-purple-500/20 to-purple-500/5" },
            { label: "Completed", value: stats.completed, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, color: "from-emerald-500/20 to-emerald-500/5" },
            { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5 text-pink-400" />, color: "from-pink-500/20 to-pink-500/5" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${stat.color} backdrop-blur-xl p-4`}
              style={{ boxShadow: "0 0 30px rgba(0,200,255,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <GlassCard glow className="mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by project or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {["all", "intake", "pending", "in_progress", "review", "report_generation", "completed", "revoked"].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status 
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 border-0" 
                    : "border-white/10 hover:bg-white/5"
                  }
                  data-testid={`button-filter-${status}`}
                >
                  {status === "all" ? "All" : status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>
        </GlassCard>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full"
            />
          </div>
        ) : filteredCerts.length === 0 ? (
          <GlassCard glow className="text-center py-16">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Certifications Found</h3>
            <p className="text-gray-400">Certifications will appear here when customers purchase</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredCerts.map((cert, index) => {
              const tierInfo = getTierInfo(cert.tier);
              const statusBadge = getStatusBadge(cert.status);
              const TierIcon = tierInfo.icon;
              
              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <GlassCard glow className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tierInfo.gradient} flex items-center justify-center shrink-0`}>
                        <TierIcon className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white truncate">{cert.projectName}</h3>
                          <Badge className={`${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                            {statusBadge.label}
                          </Badge>
                          <Badge className="bg-slate-800/50 text-gray-400 border border-white/10">
                            {tierInfo.name}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                          <span>{cert.contactEmail}</span>
                          <span>Created: {formatDate(cert.createdAt)}</span>
                          {cert.score !== null && <span>Score: {cert.score}/100</span>}
                          {cert.stripePaymentId && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {getNextStatusLabel(cert.status) && cert.status !== "report_generation" && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvance(cert.id, cert.status)}
                            disabled={processing === cert.id}
                            className="bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700"
                            data-testid={`button-advance-${cert.id}`}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {getNextStatusLabel(cert.status)}
                          </Button>
                        )}
                        {cert.status === "report_generation" && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedCert(cert)}
                            disabled={processing === cert.id}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                            data-testid={`button-complete-${cert.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Finalize & Deliver
                          </Button>
                        )}
                        {cert.status !== "completed" && cert.status !== "revoked" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(cert.id, "revoke")}
                            disabled={processing === cert.id}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            data-testid={`button-revoke-${cert.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                        {cert.status === "completed" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                              data-testid={`button-report-${cert.id}`}
                              onClick={() => window.open(`/api/guardian/certifications/${cert.id}/report`, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download Report
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                              onClick={() => window.open(`/guardian-ai-registry?cert=${cert.id}`, '_blank')}
                              data-testid={`button-registry-${cert.id}`}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Registry
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6"
              style={{ boxShadow: "0 0 60px rgba(0,200,255,0.15)" }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Complete Certification</h3>
              <p className="text-gray-400 mb-6">Project: <span className="text-white">{selectedCert.projectName}</span></p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Security Score (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    placeholder="85"
                    className="bg-slate-800/50 border-white/10"
                    data-testid="input-score"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Findings Summary</label>
                  <textarea
                    value={findingsInput}
                    onChange={(e) => setFindingsInput(e.target.value)}
                    placeholder="No critical vulnerabilities found. Minor recommendations..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
                    data-testid="input-findings"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCert(null)}
                  className="flex-1 border-white/10"
                  data-testid="button-cancel-modal"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAction(selectedCert.id, "complete", {
                    score: parseInt(scoreInput),
                    findings: findingsInput,
                  })}
                  disabled={!scoreInput || processing === selectedCert.id}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  data-testid="button-submit-complete"
                >
                  {processing === selectedCert.id ? "Processing..." : "Complete Certification"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
