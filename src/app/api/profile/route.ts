import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { rateLimit } from "@/lib/upstash-rate-limit";

// Define the profile update schema with enhanced fields
const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  image: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number").optional().nullable(),
});

export async function GET(req: Request) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the user profile from the database
    const userProfile = await db.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        phone: true,
        phoneverified: true,
        idverified: true,
        idverificationstatus: true,
        createdat: true,
        usertype: true,
      },
    });
    
    if (!userProfile) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Return the user profile
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    // Apply rate limiting
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await rateLimit(`profile_update_${ip}`);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate the request body
    const validatedData = profileUpdateSchema.parse(body);
    
    // Check if email is being changed
    if (validatedData.email !== user.email) {
      // Check if the new email is already in use
      const existingUser = await db.user.findUnique({
        where: {
          email: validatedData.email,
        },
      });
      
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { message: "Email is already in use" },
          { status: 400 }
        );
      }
    }
    
    // Check if phone is being changed
    if (validatedData.phone !== user.phone) {
      // Reset phone verification status if phone number changes
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          phoneverified: false,
        },
      });
    }
    
    // Update the user in the database
    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        image: validatedData.image,
        bio: validatedData.bio,
        phone: validatedData.phone,
        updatedat: new Date(),
      },
    });
    
    // Return the updated user (excluding sensitive information)
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
      phone: updatedUser.phone,
      phoneverified: updatedUser.phoneverified,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}