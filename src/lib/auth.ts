import { NextAuthOptions } from "next-auth";

/**
 * Auth options for NextAuth.js
 * This is a placeholder - replace with your actual auth configuration
 */
export const authOptions: NextAuthOptions = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
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