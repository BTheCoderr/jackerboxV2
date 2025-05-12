import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

import { db } from "@/lib/db";

/**
 * Auth options for NextAuth.js
 * This is a placeholder - replace with your actual auth configuration
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackUrl: `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || ''}/api/auth/callback/google`
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
      callbackUrl: `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || ''}/api/auth/callback/apple`
    }),
    CredentialsProvider({
      // ... existing credentials provider code ...
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
}; 