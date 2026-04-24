import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Bug, MessageSquare, Lightbulb, ArrowLeft, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, ChevronDown, ChevronUp, User,
  Calendar, Globe, Gamepad2, Filter, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = [
  { id: "new", label: "New", color: "cyan", icon: Clock },
  { id: "in_progress", label: "In Progress", color: "purple", icon: AlertTriangle },
  { id: "resolved", label: "Resolved", color: "emerald", icon: CheckCircle },
  { id: "wont_fix", label: "Won't Fix", color: "red", icon: XCircle },
];

const PRIORITY_OPTIONS = [
  { id: "low", label: "Low", color: "gray" },
  { id: "medium", label: "Medium", color: "purple" },
  { id: "high", label: "High", color: "red" },
  { id: "critical", label: "Critical", color: "purple" },
];

interface FeedbackReport {
  id: number;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  type: string;
  category: string;
  title: string;
  description: string;
  stepsToReproduce: string | null;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  pageUrl: string | null;
  browserInfo: string | null;
  status: string;
  priority: string | null;
  adminNotes: string | null;
  resolution: string | null;
  createdAt: string;
}

function ReportCard({ report, onUpdate }: { report: FeedbackReport; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(report.adminNotes || "");
  const [resolution, setResolution] = useState(report.resolution || "");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: { status?: string; priority?: string; adminNotes?: string; resolution?: string }) => {
      const token = sessionStorage.getItem("ownerToken");
      const res = await fetch(`/api/owner-admin/feedback/${report.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-owner-token": sessionStorage.getItem("ownerToken") || "",
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner-admin/feedback"] });
      onUpdate();
    },
  });

  const statusInfo = STATUS_OPTIONS.find(s => s.id === report.status) || STATUS_OPTIONS[0];
  const priorityInfo = PRIORITY_OPTIONS.find(p => p.id === report.priority) || PRIORITY_OPTIONS[1];
  const TypeIcon = report.type === "bug" ? Bug : report.type === "feature" ? Lightbulb : MessageSquare;

  return (
    <motion.div
      layout
      className="border border-white/10 rounded-xl bg-slate-900/50 overflow-hidden"
    >
      <div 
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            report.type === "bug" ? "bg-red-500/20" : 
            report.type === "feature" ? "bg-purple-500/20" : "bg-cyan-500/20"
          }`}>
            <TypeIcon className={`w-4 h-4 ${
              report.type === "bug" ? "text-red-400" : 
              report.type === "feature" ? "text-purple-400" : "text-cyan-400"
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-sm truncate">{report.title}</h3>
              <Badge className={`bg-${statusInfo.color}-500/20 text-${statusInfo.color}-400 border-${statusInfo.color}-500/30 text-xs`}>
                {statusInfo.label}
              </Badge>
              <Badge className={`bg-${priorityInfo.color}-500/20 text-${priorityInfo.color}-400 border-${priorityInfo.color}-500/30 text-xs`}>
                {priorityInfo.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {report.userName || report.userEmail || "Anonymous"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
              <span className="capitalize">{report.category}</span>
            </div>
          </div>
          
          {expanded ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/10 p-4 space-y-4"
        >
          <div>
            <h4 className="text-xs font-medium text-white/60 mb-1">Description</h4>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{report.description}</p>
          </div>

          {report.stepsToReproduce && (
            <div>
              <h4 className="text-xs font-medium text-white/60 mb-1">Steps to Reproduce</h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{report.stepsToReproduce}</p>
            </div>
          )}

          {(report.expectedBehavior || report.actualBehavior) && (
            <div className="grid md:grid-cols-2 gap-4">
              {report.expectedBehavior && (
                <div>
                  <h4 className="text-xs font-medium text-white/60 mb-1">Expected</h4>
                  <p className="text-sm text-white/80">{report.expectedBehavior}</p>
                </div>
              )}
              {report.actualBehavior && (
                <div>
                  <h4 className="text-xs font-medium text-white/60 mb-1">Actual</h4>
                  <p className="text-sm text-white/80">{report.actualBehavior}</p>
                </div>
              )}
            </div>
          )}

          {report.browserInfo && (
            <div>
              <h4 className="text-xs font-medium text-white/60 mb-1">Browser Info</h4>
              <p className="text-xs text-white/50 font-mono truncate">{report.browserInfo}</p>
            </div>
          )}

          <div className="border-t border-white/10 pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-white/60 mr-2">Status:</span>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateMutation.mutate({ status: s.id })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    report.status === s.id 
                      ? `bg-${s.color}-500/30 text-${s.color}-400 border border-${s.color}-500/50` 
                      : "bg-slate-800 text-white/60 hover:bg-slate-700"
                  }`}
                  disabled={updateMutation.isPending}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-white/60 mr-2">Priority:</span>
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateMutation.mutate({ priority: p.id })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    report.priority === p.id 
                      ? `bg-${p.color}-500/30 text-${p.color}-400 border border-${p.color}-500/50` 
                      : "bg-slate-800 text-white/60 hover:bg-slate-700"
                  }`}
                  disabled={updateMutation.isPending}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1 block">Admin Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/60 mb-1 block">Resolution</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="How was this resolved?"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ adminNotes: notes, resolution })}
                disabled={updateMutation.isPending}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                Save Notes
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function OwnerFeedback() {
  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (!auth) window.location.href = "/owner-admin";
  }, []);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/owner-admin/feedback", statusFilter, typeFilter],
    queryFn: async () => {
      const token = sessionStorage.getItem("ownerToken");
      if (!token) throw new Error("Not authenticated");
      
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      
      const res = await fetch(`/api/owner-admin/feedback?${params}`, {
        headers: { "x-owner-token": sessionStorage.getItem("ownerToken") || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const reports = data?.reports || [];
  const newCount = reports.filter((r: FeedbackReport) => r.status === "new").length;
  const bugCount = reports.filter((r: FeedbackReport) => r.type === "bug").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
      
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/90 backdrop-blur-xl">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <Link href="/owner-admin" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display font-bold text-xl tracking-tight">Owner Portal</span>
          </Link>
        </div>
      </nav>

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Bug Reports & Feedback</h1>
              <p className="text-white/60 text-sm">
                {reports.length} total • {newCount} new • {bugCount} bugs
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="border-white/20">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Filter className="w-4 h-4 text-white/60 mr-2 self-center" />
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                !statusFilter ? "bg-cyan-500/30 text-cyan-400" : "bg-slate-800 text-white/60"
              }`}
            >
              All
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(statusFilter === s.id ? null : s.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  statusFilter === s.id ? "bg-cyan-500/30 text-cyan-400" : "bg-slate-800 text-white/60"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 border border-white/10 rounded-xl bg-slate-900/50">
              <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No feedback reports yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: FeedbackReport) => (
                <ReportCard key={report.id} report={report} onUpdate={() => refetch()} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
