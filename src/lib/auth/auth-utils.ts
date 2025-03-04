import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth-options";
import { db } from "@/lib/db";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }
  
  const currentUser = await db.user.findUnique({
    where: {
      email: session.user.email,
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
    isAdmin: user.isAdmin || false,
    stripeConnectAccountId: user.stripeConnectAccountId || null,
    idVerified: user.idVerified || false,
    idVerificationStatus: user.idVerificationStatus || null,
    idDocumentType: user.idDocumentType || null,
    idDocumentUrl: user.idDocumentUrl || null,
    idVerificationDate: user.idVerificationDate?.toISOString() || null,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  return user;
} 