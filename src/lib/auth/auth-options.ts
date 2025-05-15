import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { compare } from 'bcryptjs';
import { User } from "next-auth";
import prisma from "@/lib/db";
import jwt from 'jsonwebtoken';

// Extend the User type to include our custom fields
interface ExtendedUser extends User {
  isAdmin?: boolean;
  stripeConnectAccountId?: string;
  userType?: string;
}

// Function to format private key
const formatPrivateKey = (key: string): string => {
  if (!key) return '';
  // If key already has the correct format, return as is
  if (key.includes('-----BEGIN PRIVATE KEY-----')) return key;
  // Add headers and format if they're missing
  return `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
};

// Function to generate Apple client secret
const generateAppleClientSecret = () => {
  const clientId = process.env.APPLE_CLIENT_ID!;
  const teamId = process.env.APPLE_TEAM_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  const privateKey = formatPrivateKey(process.env.APPLE_PRIVATE_KEY!);

  if (!clientId || !teamId || !keyId || !privateKey) {
    throw new Error('Missing Apple Sign In configuration');
  }

  try {
    return jwt.sign({
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 180 days
      aud: 'https://appleid.apple.com',
      sub: clientId,
    }, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
      },
    });
  } catch (error) {
    console.error('Error generating Apple client secret:', error);
    throw error;
  }
};

// Determine the base URL for callbacks
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXTAUTH_URL || "http://localhost:3001";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    signOut: "/auth/logout",
  },
  // Add debug mode for development only
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Only include Apple provider if credentials are available
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY ? [
      AppleProvider({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: generateAppleClientSecret(),
        authorization: {
          params: {
            scope: 'name email',
            response_mode: 'form_post',
            response_type: 'code'
          }
        },
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name?.firstName 
              ? `${profile.name.firstName} ${profile.name.lastName || ''}`
              : profile.email?.split('@')[0],
            email: profile.email,
            image: null,
            appleId: profile.sub
          }
        }
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }

          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isAdmin: user.isAdmin || false,
            stripeConnectAccountId: user.stripeConnectAccountId || undefined,
            userType: user.userType || "both",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
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
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.isAdmin = (user as ExtendedUser).isAdmin;
        token.stripeConnectAccountId = (user as ExtendedUser).stripeConnectAccountId;
        token.userType = (user as ExtendedUser).userType;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
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
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        console.log("New user signed up:", user.email);
      }
    },
    async signOut() {
      // Clean up any user-specific resources
    },
    async createUser({ user }) {
      console.log("New user created:", user.email);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 