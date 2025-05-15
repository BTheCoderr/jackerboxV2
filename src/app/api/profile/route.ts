import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Define the profile update schema
const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  image: z.string().optional(),
  userType: z.enum(["renter", "owner", "both"], {
    required_error: "Please select a user type",
  }).optional(),
});

export async function PUT(req: Request) {
  try {
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

    // Check if user is changing from owner/both to renter and has equipment
    if (validatedData.userType === "renter" && (user.userType === "owner" || user.userType === "both")) {
      // Check if user has equipment listings
      const equipmentCount = await db.equipment.count({
        where: {
          ownerId: user.id,
        },
      });

      if (equipmentCount > 0) {
        return NextResponse.json(
          { message: "You cannot switch to renter-only mode while you have active equipment listings. Please remove your listings first." },
          { status: 400 }
        );
      }
    }

    // Check if user is changing from owner/both to renter and has rentals (as an owner)
    if (validatedData.userType === "renter" && (user.userType === "owner" || user.userType === "both")) {
      // Check if user has active rentals as an owner
      const activeRentalsCount = await db.rental.count({
        where: {
          equipment: {
            ownerId: user.id,
          },
          status: {
            not: {
              in: ["Completed", "Cancelled"]
            },
          },
        },
      });

      if (activeRentalsCount > 0) {
        return NextResponse.json(
          { message: "You cannot switch to renter-only mode while you have active rental requests. Please complete or cancel them first." },
          { status: 400 }
        );
      }
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
        userType: validatedData.userType,
      },
    });
    
    // Return the updated user (excluding sensitive information)
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      userType: updatedUser.userType,
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