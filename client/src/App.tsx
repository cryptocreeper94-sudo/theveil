import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import VeilReader from "@/pages/veil-reader";
import Veil from "@/pages/veil";
import VeilPrintVol2 from "@/pages/veil-print-vol2";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Veil} />
      <Route path="/read" component={VeilReader} />
      <Route path="/print/vol2" component={VeilPrintVol2} />
      <Route path="/veil" component={Veil} />
      <Route path="/veil/read" component={VeilReader} />
      <Route path="/veil/print/vol2" component={VeilPrintVol2} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
