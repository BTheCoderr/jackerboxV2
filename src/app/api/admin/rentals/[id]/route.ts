import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    // Check if user is admin
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Check if rental exists
    const rental = await db.rental.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: "Rental not found" },
        { status: 404 }
      );
    }

    // Delete the rental
    await db.rental.delete({
      where: {
        id: params.id,
      },
    });

    // Log the deletion
    console.log(`Rental ${rental.id} deleted by admin ${user.id}`);

    return NextResponse.json({
      message: "Rental deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rental:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the rental" },
      { status: 500 }
    );
  }
} 