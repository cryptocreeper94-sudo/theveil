import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Building2,
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  FileText,
  BadgeCheck,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/glass-card";
import { useToast } from "@/hooks/use-toast";

interface BusinessApplication {
  id: string;
  userId: string;
  businessName: string;
  einNumber: string;
  website: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  businessDescription: string;
  intendedUse: string | null;
  employeeCount: string | null;
  country: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

export default function BusinessVerificationAdmin() {
  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (!auth) window.location.href = "/owner-admin";
  }, []);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});
  const [mainStreetCount, setMainStreetCount] = useState(20);

  const getOwnerHeaders = () => ({
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
  });

  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ["/api/owner/business-applications", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/owner/business-applications?status=${statusFilter}`, {
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json() as Promise<BusinessApplication[]>;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes, mainStreet }: { id: string; notes: string; mainStreet?: boolean }) => {
      const res = await fetch(`/api/owner/business-applications/${id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getOwnerHeaders(),
        },
        body: JSON.stringify({ notes, mainStreet }),
      });
      if (!res.ok) throw new Error("Failed to approve application");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Approved", description: "Business application approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/business-applications"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/owner/business-applications/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getOwnerHeaders(),
        },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to reject application");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rejected", description: "Business application rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/business-applications"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const filteredApps = (applications || []).filter((app) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      app.businessName.toLowerCase().includes(search) ||
      app.einNumber.toLowerCase().includes(search) ||
      app.contactEmail.toLowerCase().includes(search) ||
      app.contactName.toLowerCase().includes(search)
    );
  });

  const pendingCount = (applications || []).filter(a => a.status === "pending").length;
  const approvedCount = (applications || []).filter(a => a.status === "approved").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/owner-admin">
            <Button variant="ghost" className="mb-4 text-white/60 hover:text-white" data-testid="link-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Owner Portal
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-8 h-8 text-purple-400" />
                Business Verification
              </h1>
              <p className="text-white/60">Review and approve business membership applications</p>
            </div>
            <Button 
              variant="outline" 
              className="border-white/20"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
                <p className="text-xs text-white/60">Pending Review</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{approvedCount}</p>
                <p className="text-xs text-white/60">Approved</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.min(approvedCount, mainStreetCount)}/{mainStreetCount}</p>
                <p className="text-xs text-white/60">Main Street Slots</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{(applications || []).length}</p>
                <p className="text-xs text-white/60">Total Applications</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard glow className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search by name, EIN, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-purple-600" : "border-white/20"}
                  data-testid={`filter-${status}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          {isLoading ? (
            <GlassCard className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-3 animate-spin" />
              <p className="text-white/60">Loading applications...</p>
            </GlassCard>
          ) : filteredApps.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Building2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No applications found</p>
            </GlassCard>
          ) : (
            filteredApps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard glow className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    data-testid={`app-row-${app.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{app.businessName}</h3>
                        <p className="text-sm text-white/60">{app.contactEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(app.status)}
                      <span className="text-xs text-white/40">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                      {expandedApp === app.id ? (
                        <ChevronUp className="w-5 h-5 text-white/40" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                  </div>

                  {expandedApp === app.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-400" />
                            Business Details
                          </h4>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-white/50 mb-1">EIN / Registration Number</p>
                            <p className="text-white font-mono">{app.einNumber}</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-white/50 mb-1">Country</p>
                            <p className="text-white">{app.country}</p>
                          </div>
                          {app.employeeCount && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-white/50 mb-1">Employee Count</p>
                              <p className="text-white">{app.employeeCount}</p>
                            </div>
                          )}
                          {app.website && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-white/50 mb-1">Website</p>
                              <a 
                                href={app.website.startsWith("http") ? app.website : `https://${app.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              >
                                <Globe className="w-3 h-3" />
                                {app.website}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-400" />
                            Contact Information
                          </h4>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-white/50 mb-1">Contact Name</p>
                            <p className="text-white">{app.contactName}</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-white/50 mb-1">Email</p>
                            <a 
                              href={`mailto:${app.contactEmail}`}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              {app.contactEmail}
                            </a>
                          </div>
                          {app.contactPhone && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-white/50 mb-1">Phone</p>
                              <p className="text-white flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {app.contactPhone}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-white mb-2">Business Description</h4>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <p className="text-white/80 text-sm">{app.businessDescription}</p>
                        </div>
                      </div>

                      {app.intendedUse && (
                        <div className="mb-4">
                          <h4 className="font-medium text-white mb-2">Intended Use</h4>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-white/80 text-sm">{app.intendedUse}</p>
                          </div>
                        </div>
                      )}

                      {app.status === "pending" && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          <div>
                            <label className="block text-sm text-white/60 mb-2">Review Notes (optional)</label>
                            <textarea
                              value={reviewNotes[app.id] || ""}
                              onChange={(e) => setReviewNotes({ ...reviewNotes, [app.id]: e.target.value })}
                              placeholder="Add notes about this application..."
                              className="w-full p-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:outline-none resize-none"
                              rows={2}
                              data-testid={`notes-${app.id}`}
                            />
                          </div>
                          
                          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                id={`mainstreet-${app.id}`}
                                className="w-4 h-4 rounded border-white/20 bg-slate-800"
                                data-testid={`checkbox-mainstreet-${app.id}`}
                              />
                              <Store className="w-4 h-4 text-purple-400" />
                              <span className="text-white text-sm">
                                Grant Main Street storefront in Chronicles ({Math.min(approvedCount, mainStreetCount)}/{mainStreetCount} slots filled)
                              </span>
                            </label>
                            <p className="text-xs text-white/50 mt-1 ml-6">
                              First {mainStreetCount} verified businesses get virtual store space in game city centers
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => {
                                const mainStreet = (document.getElementById(`mainstreet-${app.id}`) as HTMLInputElement)?.checked;
                                approveMutation.mutate({
                                  id: app.id,
                                  notes: reviewNotes[app.id] || "",
                                  mainStreet,
                                });
                              }}
                              disabled={approveMutation.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              data-testid={`approve-${app.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Business
                            </Button>
                            <Button
                              onClick={() => {
                                if (!reviewNotes[app.id]) {
                                  toast({ title: "Required", description: "Please add rejection reason in notes", variant: "destructive" });
                                  return;
                                }
                                rejectMutation.mutate({
                                  id: app.id,
                                  notes: reviewNotes[app.id],
                                });
                              }}
                              disabled={rejectMutation.isPending}
                              variant="outline"
                              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                              data-testid={`reject-${app.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {app.reviewedAt && (
                        <div className="mt-4 p-3 bg-white/5 rounded-lg">
                          <p className="text-xs text-white/50">
                            Reviewed on {new Date(app.reviewedAt).toLocaleDateString()} 
                            {app.reviewedBy && ` by ${app.reviewedBy}`}
                          </p>
                          {app.reviewNotes && (
                            <p className="text-sm text-white/70 mt-1">{app.reviewNotes}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
