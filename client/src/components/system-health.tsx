import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchSystemHealth, type ServiceHealth } from "@/lib/api";

function StatusIcon({ status }: { status: ServiceHealth["status"] }) {
  switch (status) {
    case "operational":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="w-4 h-4 text-teal-500" />;
    case "down":
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
}

function StatusBadge({ status }: { status: ServiceHealth["status"] }) {
  const variants = {
    operational: "bg-green-500/20 text-green-400 border-green-500/30",
    degraded: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    down: "bg-red-500/20 text-red-400 border-red-500/30"
  };
  
  const labels = {
    operational: "Operational",
    degraded: "Degraded",
    down: "Down"
  };
  
  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

function OverallStatusIndicator({ status }: { status: ServiceHealth["status"] }) {
  const colors = {
    operational: "bg-green-500",
    degraded: "bg-teal-500",
    down: "bg-red-500"
  };
  
  const labels = {
    operational: "All Systems Operational",
    degraded: "Some Systems Degraded",
    down: "System Outage"
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
        <div className={`absolute inset-0 w-3 h-3 rounded-full ${colors[status]} animate-ping opacity-75`} />
      </div>
      <span className="font-medium text-sm">{labels[status]}</span>
    </div>
  );
}

export function SystemHealthWidget() {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ["system-health"],
    queryFn: fetchSystemHealth,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card className="bg-black/40 border-red-500/20 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">Unable to fetch system status</p>
        </CardContent>
      </Card>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            System Health
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            v{health.version}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <OverallStatusIndicator status={health.status} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Uptime: {formatUptime(health.uptime)}
          </div>
        </div>

        <div className="space-y-2">
          {health.services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              data-testid={`service-status-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={service.status} />
                <div>
                  <p className="text-sm font-medium">{service.name}</p>
                  {service.message && (
                    <p className="text-xs text-muted-foreground">{service.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {service.latency !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {service.latency}ms
                  </span>
                )}
                <StatusBadge status={service.status} />
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Last checked: {new Date(health.timestamp).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
