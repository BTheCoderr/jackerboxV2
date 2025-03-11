import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
      stripeConnectAccountId?: string;
      userType?: string;
    } & DefaultSession["user"];
  }
  
  interface User {
    isAdmin?: boolean;
    stripeConnectAccountId?: string;
    userType?: string;
  }
} 