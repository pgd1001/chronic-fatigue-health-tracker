import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/connection";
import { users, userProfiles } from "@/lib/db/schema";
import { DEV_MODE, devAuth } from "./dev-bypass";

// Create auth instance only if database is available
let authInstance: any = null;

if (!DEV_MODE && process.env.DATABASE_URL) {
  authInstance = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: users,
        account: userProfiles, // Using userProfiles as extended user data
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Disabled for development
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
      generateId: () => crypto.randomUUID(),
    },
    trustedOrigins: [
      process.env.NEXTAUTH_URL || "http://localhost:3000",
    ],
  });
}

// Export auth function that uses dev bypass when needed
export const auth = async () => {
  if (DEV_MODE) {
    return devAuth();
  }
  
  if (!authInstance) {
    throw new Error("Auth not configured - DATABASE_URL required");
  }
  
  return authInstance.api.getSession();
};