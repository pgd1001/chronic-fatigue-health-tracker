"use client";

import { useSession } from "@/lib/auth/client";
import { AuthWrapper } from "./auth-wrapper";
import { Loader2 } from "lucide-react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthWrapper onSuccess={() => window.location.reload()} />;
  }

  return <>{children}</>;
}