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
              user: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {},
        status ? { status } : {},
      ],
    };

    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        select: {
          id: true,
          userid: true,
          status: true,
          documenttype: true,
          documenturl: true,
          notes: true,
          submittedat: true,
          processedat: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { submittedat: "desc" },
        skip,
        take: limit,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[ADMIN_VERIFICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 