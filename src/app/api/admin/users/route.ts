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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isSuspended: true,
          createdAt: true,
          _count: {
            select: {
              equipment: true,
              rentals: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
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
    const { userId, action } = body;

    if (!userId || !action) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (action !== "suspend" && action !== "activate") {
      return new NextResponse("Invalid action", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.role === "ADMIN") {
      return new NextResponse("Cannot modify admin users", { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: action === "suspend",
      },
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[ADMIN_USERS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 