import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

// Extend the default NextAuth user session with our custom fields
export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin: boolean;
  stripeConnectAccountId?: string | null;
  userType?: string | null;
}

// Base URL for callbacks
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Mock user in development mode
const MOCK_USER = {
  id: "mock_user_123",
  name: "Mock User",
  email: "user@example.com",
  image: "https://i.pravatar.cc/150?img=3",
  isAdmin: true,
  userType: "both",
  emailVerified: new Date().toISOString(),
  idVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const authOptions: NextAuthOptions = {
  adapter: process.env.NODE_ENV === 'development' ? undefined : PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          idVerified: user.idVerified
        };
      }
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.isAdmin = token.isAdmin;
        session.user.idVerified = token.idVerified;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isAdmin = user.isAdmin;
        token.idVerified = user.idVerified;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) {
      // Log sign in event
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      // Log sign out event
      console.log(`User signed out: ${token.email}`);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}; 