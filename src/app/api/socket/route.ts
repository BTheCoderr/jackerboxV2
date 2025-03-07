import { NextResponse } from "next/server";
import { initSocketServer } from "@/lib/socket/socket-server";

export async function GET(req: Request) {
  try {
    // Socket.io will handle the connection upgrade
    return new NextResponse("Socket.io server is running", {
      status: 200,
    });
  } catch (error) {
    console.error("Socket.io error:", error);
    return new NextResponse("Error initializing Socket.io server", {
      status: 500,
    });
  }
}

export const dynamic = "force-dynamic"; 