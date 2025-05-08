import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";

/**
 * Admin API endpoint to fetch verification requests
 * This API is only accessible to administrators
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isadmin: true,
      },
    });

    if (!user?.isadmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all verification requests
    const requests = await prisma.verificationRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isadmin: true,
            idverificationstatus: true,
          },
        },
      },
      orderBy: {
        submittedat: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { requestId, status, notes } = data;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isadmin: true,
      },
    });

    if (!user?.isadmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update verification request
    const verificationRequest = await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status,
        notes,
      },
    });

    // Update user's verification status if request is approved
    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: verificationRequest.userid },
        data: {
          idverified: true,
          idverificationstatus: 'VERIFIED',
          idverificationdate: new Date(),
        },
      });
    } else if (status === "REJECTED") {
      await prisma.user.update({
        where: { id: verificationRequest.userid },
        data: {
          idverified: false,
          idverificationstatus: "REJECTED",
        },
      });
    }

    return NextResponse.json(verificationRequest);
  } catch (error) {
    console.error("Error updating verification request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 