import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    };

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          status: true,
          isVerified: true,
          createdAt: true,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              rentals: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json({
      equipment,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[ADMIN_EQUIPMENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { equipmentId, action } = body;

    if (!equipmentId || !action) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (action !== "verify" && action !== "unverify" && action !== "remove") {
      return new NextResponse("Invalid action", { status: 400 });
    }

    if (action === "remove") {
      const equipment = await prisma.equipment.delete({
        where: { id: equipmentId },
        select: { id: true },
      });

      return NextResponse.json(equipment);
    }

    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        isVerified: action === "verify",
      },
      select: {
        id: true,
        name: true,
        isVerified: true,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("[ADMIN_EQUIPMENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 