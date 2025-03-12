import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import { User } from "next-auth";

import { db } from "@/lib/db";

// Extend the User type to include our custom fields
interface ExtendedUser extends User {
  isAdmin?: boolean;
  stripeConnectAccountId?: string;
  userType?: string;
}

// Determine the base URL for callbacks
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXTAUTH_URL || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        // Check if identifier is an email or phone number
        const isEmail = credentials.identifier.includes('@');
        
        // Find user by email or phone
        const user = await db.user.findFirst({
          where: isEmail 
            ? { email: credentials.identifier }
            : { phone: credentials.identifier },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Return user with the correct type
        return {
          id: user.id,
          name: user.name,
          email: user.email || "",
          image: user.image,
          isAdmin: !!(user as any).isAdmin,
          stripeConnectAccountId: (user as any).stripeConnectAccountId || undefined,
          userType: (user as any).userType || undefined,
        } as ExtendedUser;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.stripeConnectAccountId = token.stripeConnectAccountId as string | undefined;
        session.user.userType = token.userType as string | undefined;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.isAdmin = (user as ExtendedUser).isAdmin;
        token.stripeConnectAccountId = (user as ExtendedUser).stripeConnectAccountId;
        token.userType = (user as ExtendedUser).userType;
      }

      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}; 