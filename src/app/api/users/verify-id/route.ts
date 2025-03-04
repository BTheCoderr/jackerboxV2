import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { verifyIDDocument } from "@/lib/id-verification";
import { db } from "@/lib/db";

// Schema for ID verification request
const verifyIDSchema = z.object({
  idDocumentUrl: z.string().url("ID document must be a valid URL"),
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
    const { idDocumentUrl, documentType } = verifyIDSchema.parse(body);
    
    // Verify the ID document
    const verificationResult = await verifyIDDocument(idDocumentUrl);
    
    // Update user record with verification status
    await db.user.update({
      where: { id: user.id },
      data: {
        idDocumentUrl,
        idDocumentType: documentType,
        idVerificationStatus: verificationResult.isValid ? "approved" : "pending",
        idVerified: verificationResult.isValid,
        idVerificationDate: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      ...verificationResult,
      status: verificationResult.isValid ? "approved" : "pending",
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