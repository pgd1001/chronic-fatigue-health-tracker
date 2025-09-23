"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { useSession } from "@/lib/auth/client";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (session) {
      router.push(redirectTo);
    }
  }, [session, router, redirectTo]);

  const handleSuccess = () => {
    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AuthWrapper onSuccess={handleSuccess} />
    </div>
  );
}