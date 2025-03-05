import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Jackerbox</h1>
      <p className="mb-4">
        This is a simple test page to verify that the Netlify deployment is working correctly.
      </p>
    </div>
  );
}
