import { useState } from "react";
import { startRegistration as webauthnStartRegistration, startAuthentication as webauthnStartAuthentication } from "@simplewebauthn/browser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { Fingerprint, Trash2, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Passkey {
  id: string;
  deviceType: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
}

async function fetchPasskeys(): Promise<Passkey[]> {
  const res = await fetch("/api/webauthn/passkeys", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

async function registerPasskey() {
  const startRes = await fetch("/api/webauthn/register/start", {
    method: "POST",
    credentials: "include",
  });
  if (!startRes.ok) throw new Error("Failed to start registration");
  
  const options = await startRes.json();
  const credential = await webauthnStartRegistration({ optionsJSON: options });
  
  const finishRes = await fetch("/api/webauthn/register/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credential),
  });
  
  if (!finishRes.ok) throw new Error("Failed to complete registration");
  return finishRes.json();
}

async function deletePasskeyRequest(id: string) {
  const res = await fetch(`/api/webauthn/passkeys/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete passkey");
  return res.json();
}

export function PasskeyManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: passkeys = [], isLoading } = useQuery({
    queryKey: ["passkeys"],
    queryFn: fetchPasskeys,
  });
  
  const registerMutation = useMutation({
    mutationFn: registerPasskey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      toast({
        title: "Passkey registered",
        description: "You can now use biometric login on this device.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not register passkey. Try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deletePasskeyRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      toast({
        title: "Passkey removed",
        description: "The passkey has been deleted from your account.",
      });
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <GlassCard>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Biometric Login</h3>
        </div>
        
        <p className="text-xs text-muted-foreground mb-4">
          Use Face ID, Touch ID, or Windows Hello to sign in faster and more securely.
        </p>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length > 0 ? (
          <div className="space-y-2 mb-4">
            {passkeys.map((pk) => (
              <div 
                key={pk.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-sm font-medium">
                      {pk.deviceType === "singleDevice" ? "This Device" : "Synced Passkey"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added {formatDate(pk.createdAt)} • Last used {formatDate(pk.lastUsedAt)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(pk.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  data-testid={`button-delete-passkey-${pk.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-2 text-center border border-dashed border-white/10 rounded-lg mb-4">
            No passkeys registered
          </div>
        )}
        
        <Button
          onClick={() => registerMutation.mutate()}
          disabled={registerMutation.isPending}
          className="w-full bg-primary text-background hover:bg-primary/90"
          data-testid="button-register-passkey"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Fingerprint className="w-4 h-4 mr-2" />
              {passkeys.length > 0 ? "Add Another Passkey" : "Register Passkey"}
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
}

export function PasskeyLoginButton({ onSuccess }: { onSuccess?: (user: any) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    try {
      const startRes = await fetch("/api/webauthn/authenticate/start", {
        method: "POST",
      });
      if (!startRes.ok) throw new Error("Failed to start authentication");
      
      const { requestId, ...options } = await startRes.json();
      const credential = await webauthnStartAuthentication({ optionsJSON: options });
      
      const finishRes = await fetch("/api/webauthn/authenticate/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...credential, requestId }),
      });
      
      if (!finishRes.ok) throw new Error("Authentication failed");
      
      const result = await finishRes.json();
      if (result.success && result.user) {
        if (result.sessionToken) {
          localStorage.setItem("sessionToken", result.sessionToken);
        }
        onSuccess?.(result.user);
        window.location.href = "/my-hub";
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Could not authenticate with passkey.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePasskeyLogin}
      disabled={isLoading}
      className="w-full h-14 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-base rounded-xl shadow-lg shadow-cyan-500/20 border border-cyan-500/30"
      data-testid="button-passkey-login"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
      ) : (
        <Fingerprint className="w-5 h-5 mr-3" />
      )}
      Sign in with Fingerprint
    </Button>
  );
}
