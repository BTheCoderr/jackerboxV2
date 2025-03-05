import { NextResponse } from "next/server";

// Simple API route that doesn't use Arcjet yet
export async function GET(req: Request) {
  return NextResponse.json({ message: "Hello world" });
} 