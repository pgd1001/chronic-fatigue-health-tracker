"use client";

import { useState } from "react";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

interface AuthWrapperProps {
  onSuccess?: () => void;
  defaultMode?: "signin" | "signup";
}

export function AuthWrapper({ onSuccess, defaultMode = "signin" }: AuthWrapperProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {mode === "signin" ? (
          <SignInForm
            onSuccess={onSuccess}
            onSwitchToSignUp={() => setMode("signup")}
          />
        ) : (
          <SignUpForm
            onSuccess={onSuccess}
            onSwitchToSignIn={() => setMode("signin")}
          />
        )}
      </div>
    </div>
  );
}