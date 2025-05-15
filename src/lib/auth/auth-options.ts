import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import prisma from "@/lib/db";
import { Adapter } from "next-auth/adapters";

// Extend the built-in types
declare module "next-auth" {
  interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    password?: string | null;
    isAdmin?: boolean;
    stripeConnectAccountId?: string;
    userType?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      isAdmin: boolean;
      stripeConnectAccountId?: string;
      userType?: string;
    };
  }

  interface JWT {
    id: string;
    name: string | null;
    email: string;
    picture: string | null;
    isAdmin: boolean;
    stripeConnectAccountId?: string;
    userType?: string;
  }
}

// Function to get Apple private key
const getApplePrivateKey = (): string => {
  // First check if we have a file path
  const keyPath = process.env.APPLE_PRIVATE_KEY_PATH;
  
  if (keyPath) {
    try {
      // Resolve path relative to project root
      const resolvedPath = path.resolve(process.cwd(), keyPath);
      console.log(`Reading Apple private key from ${resolvedPath}`);
      
      // Read the key file
      const key = fs.readFileSync(resolvedPath, 'utf8');
      if (key) return key.trim();
    } catch (error) {
      console.error(`Error reading Apple private key from ${keyPath}:`, error);
    }
  }
  
  // Fall back to environment variable
  return process.env.APPLE_PRIVATE_KEY || '';
};

// Function to format private key
const formatPrivateKey = (key: string): string => {
  if (!key) return '';
  
  // Strip quotes and cleanup
  key = key.replace(/^["']|["']$/g, '').trim();
  
  // If the key is already in PEM format, return it
  if (key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('-----END PRIVATE KEY-----')) {
    return key;
  }
  
  // If the key is in EC format, return it
  if (key.includes('-----BEGIN EC PRIVATE KEY-----') && key.includes('-----END EC PRIVATE KEY-----')) {
    return key;
  }
  
  // Remove any headers/footers that might be malformed
  let cleanKey = key
    .replace(/-----BEGIN[^-]*-----/g, '')
    .replace(/-----END[^-]*-----/g, '')
    .replace(/[\r\n\s]+/g, '');
  
  // Try to format as PEM
  try {
    return `-----BEGIN PRIVATE KEY-----\n${
      cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey
    }\n-----END PRIVATE KEY-----`;
  } catch (error) {
    console.error('Error formatting private key:', error);
    throw new Error('Invalid private key format');
  }
};

// Function to generate Apple client secret
const generateAppleClientSecret = () => {
  const clientId = process.env.APPLE_CLIENT_ID!;
  const teamId = process.env.APPLE_TEAM_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  
  try {
    // Get the key from file or environment variable
    const rawKey = getApplePrivateKey();
    const privateKey = formatPrivateKey(rawKey);

    if (!clientId || !teamId || !keyId || !privateKey) {
      throw new Error('Missing Apple Sign In configuration');
    }

    // Generate the client secret
    const token = jwt.sign({
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 180 days
      aud: 'https://appleid.apple.com',
      sub: clientId,
    }, privateKey, {
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
        kid: keyId,
      },
    });

    return token;
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
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth',
  },
  // Add debug mode for development only
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    // AppleProvider disabled until key issues are resolved
    // AppleProvider({
    //   clientId: process.env.APPLE_CLIENT_ID!,
    //   clientSecret: generateAppleClientSecret(),
    //   authorization: {
    //     params: {
    //       response_type: 'code',
    //       response_mode: 'form_post',
    //       scope: 'name email',
    //     },
    //   },
    // }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            password: true,
            isAdmin: true,
            stripeConnectAccountId: true,
            userType: true,
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          stripeConnectAccountId: user.stripeConnectAccountId || undefined,
          userType: user.userType || 'both',
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name || null;
        session.user.email = token.email;
        session.user.image = token.picture || null;
        session.user.isAdmin = token.isAdmin || false;
        session.user.stripeConnectAccountId = token.stripeConnectAccountId;
        session.user.userType = token.userType;
      }

      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email!,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isAdmin: true,
          stripeConnectAccountId: true,
          userType: true,
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user?.id;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        isAdmin: dbUser.isAdmin || false,
        stripeConnectAccountId: dbUser.stripeConnectAccountId || undefined,
        userType: dbUser.userType || 'both',
      };
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