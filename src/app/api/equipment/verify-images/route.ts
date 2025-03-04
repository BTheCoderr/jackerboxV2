import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { verifyImages } from "@/lib/image-verification";

// Schema for image verification request
const verifyImagesSchema = z.object({
  images: z.array(z.string().url("Each image must be a valid URL")),
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
    const { images } = verifyImagesSchema.parse(body);
    
    // Verify the images
    const verificationResults = await verifyImages(images);
    
    return NextResponse.json({
      success: true,
      ...verificationResults
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Image verification error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 