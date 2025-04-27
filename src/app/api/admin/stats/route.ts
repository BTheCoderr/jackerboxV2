import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all required statistics in parallel
    const [
      totalUsers,
      totalEquipment,
      totalRentals,
      activeRentals,
      pendingVerifications,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.equipment.count(),
      prisma.rental.count(),
      prisma.rental.count({
        where: { status: "ACTIVE" },
      }),
      prisma.equipment.count({
        where: { isVerified: false },
      }),
      prisma.rental.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: "COMPLETED",
        },
      }),
    ]);

    // Calculate platform revenue (assuming 10% platform fee)
    const platformRevenue = (revenue._sum.totalAmount || 0) * 0.1;

    return NextResponse.json({
      totalUsers,
      totalEquipment,
      totalRentals,
      activeRentals,
      pendingVerifications,
      platformRevenue,
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 