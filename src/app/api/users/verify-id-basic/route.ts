import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { verifyIDDocumentBasic } from "@/lib/id-verification-basic";
import { db } from "@/lib/db";

// Schema for ID verification request
const verifyIDSchema = z.object({
  idDocumentBase64: z.string().min(1, "ID document image is required"),
  documentType: z.enum(["passport", "driver_license", "national_id"]),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { idDocumentBase64, documentType } = verifyIDSchema.parse(body);
    
    // Convert base64 to buffer
    const base64Data = idDocumentBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Verify the ID document using basic verification
    const verificationResult = await verifyIDDocumentBasic(buffer);
    
    // Store the document in a secure location (in production, use proper storage)
    // For MVP, we'll just store the verification status
    
    // Update user record with verification status
    await db.user.update({
      where: { id: user.id },
      data: {
        idDocumentType: documentType,
        idVerificationStatus: verificationResult.needsManualReview ? "pending" : (verificationResult.isValid ? "approved" : "rejected"),
        idVerified: verificationResult.isValid && !verificationResult.needsManualReview,
        idVerificationDate: new Date(),
      },
    });
    
    // If manual review is needed, create a notification for admins
    if (verificationResult.needsManualReview) {
      // Find admin users
      const admins = await db.user.findMany({
        where: { isAdmin: true },
        select: { id: true }
      });
      
      // Create notifications for each admin
      for (const admin of admins) {
        await db.notification.create({
          data: {
            type: "ID_VERIFICATION_REVIEW",
            userId: admin.id,
            data: {
              message: `New ID verification request from ${user.name || user.email} needs review`,
              userId: user.id,
              documentType: documentType,
              confidence: verificationResult.confidence
            },
            read: false,
          },
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      ...verificationResult,
      status: verificationResult.needsManualReview ? "pending" : (verificationResult.isValid ? "approved" : "rejected"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("ID verification error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 