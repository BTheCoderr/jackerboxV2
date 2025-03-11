import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";
import { db } from "@/lib/db";

// Define a more complete user type that includes all fields from the schema
export interface ExtendedUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  password: string | null;
  phone: string | null;
  phoneVerified: boolean;
  bio: string | null;
  verificationToken: string | null;
  twoFactorEnabled: boolean;
  isAdmin: boolean;
  userType: string | null;
  stripeConnectAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  // Add ID verification fields
  idVerified: boolean;
  idVerificationStatus: string | null;
  idDocumentType: string | null;
  idDocumentUrl: string | null;
  idVerificationDate: string | null;
}

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<ExtendedUser | null> {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return null;
    }

    const currentUser = await db.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    if (!currentUser) {
      return null;
    }

    // Use type assertion to avoid TypeScript errors
    const user = currentUser as any;

    return {
      ...currentUser,
      createdAt: currentUser.createdAt.toISOString(),
      updatedAt: currentUser.updatedAt.toISOString(),
      emailVerified: currentUser.emailVerified?.toISOString() || null,
      idVerificationDate: user.idVerificationDate?.toISOString() || null,
    } as ExtendedUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
} 