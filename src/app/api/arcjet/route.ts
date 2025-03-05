import { NextResponse } from "next/server";

// Simple API route that doesn't use Arcjet yet
export async function GET(req: Request) {
  // Return a standard Response object instead of NextResponse
  return new Response(JSON.stringify({ message: "Hello world" }), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
  });
} 