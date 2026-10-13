import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from 'bcryptjs';
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

// Apple sign-in is disabled until an authenticated, audited implementation is available.

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
      allowDangerousEmailAccountLinking: false,
    }),
    // AppleProvider intentionally not enabled without a verified configuration.
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        phone: { label: 'Phone', type: 'text' },
        type: { label: 'Type', type: 'text' }, // 'email' or 'phone'
      },
      async authorize(credentials) {
        // Phone-only sign-in is disabled until a verified one-time code is required.
        // Handle email/password authentication
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

        const { password: _password, ...userWithoutPassword } = user;
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
        session.user.id = typeof token.id === 'string' ? token.id : '';
        session.user.name = typeof token.name === 'string' ? token.name : null;
        session.user.email = typeof token.email === 'string' ? token.email : '';
        session.user.image = token.picture || null;
        session.user.isAdmin = token.isAdmin === true;
        session.user.stripeConnectAccountId = typeof token.stripeConnectAccountId === 'string' ? token.stripeConnectAccountId : undefined;
        session.user.userType = typeof token.userType === 'string' ? token.userType : undefined;
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
    async signIn({ user, isNewUser }) {
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