"use client";

import { createAuthClient } from "better-auth/react";
import { DEV_MODE, devUseSession } from "./dev-bypass";

// Create auth client only if not in dev mode
let authClient: any = null;

if (!DEV_MODE) {
  authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });
}

// Export functions with dev bypass
export const signIn = async (credentials: any) => {
  if (DEV_MODE) {
    console.log("Dev mode: Sign in bypassed");
    return { data: { user: null }, error: null };
  }
  return authClient?.signIn.email(credentials) || { data: null, error: "Auth not configured" };
};

export const signUp = async (credentials: any) => {
  if (DEV_MODE) {
    console.log("Dev mode: Sign up bypassed");
    return { data: { user: null }, error: null };
  }
  return authClient?.signUp.email(credentials) || { data: null, error: "Auth not configured" };
};

export const signOut = async () => {
  if (DEV_MODE) {
    console.log("Dev mode: Sign out bypassed");
    return;
  }
  return authClient?.signOut();
};

export const useSession = () => {
  if (DEV_MODE) {
    return devUseSession();
  }
  return authClient?.useSession() || { data: null, isPending: false, error: null };
};

export const getSession = async () => {
  if (DEV_MODE) {
    return devUseSession().data;
  }
  return authClient?.getSession() || null;
};