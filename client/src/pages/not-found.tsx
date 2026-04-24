import { Link } from "wouter";
import { Home, AlertCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 p-8 relative z-10"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="flex items-center justify-center gap-4"
        >
          <AlertCircle className="h-16 w-16 text-primary" data-testid="icon-404" />
          <h1 className="text-8xl font-display font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent" data-testid="text-404">
            404
          </h1>
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold" data-testid="text-page-not-found">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-404-description">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button className="bg-primary text-background hover:bg-primary/90 gap-2" data-testid="button-go-home">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/explorer">
            <Button variant="ghost" className="gap-2" data-testid="button-explore">
              <Search className="w-4 h-4" />
              Explore Chain
            </Button>
          </Link>
        </div>
        
        <p className="text-xs text-muted-foreground pt-8" data-testid="text-support-link">
          Need help? Contact{" "}
          <a href="mailto:team@dwsc.io" className="text-primary hover:underline" data-testid="link-support-email">
            team@dwsc.io
          </a>
        </p>
      </motion.div>
    </div>
  );
}
