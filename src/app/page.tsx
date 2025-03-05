import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-6">
            Welcome to Jackerbox
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            The equipment rental marketplace that connects people with the gear they need.
          </p>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Static Deployment</h2>
            <p className="mb-4">
              This is a simplified static version of Jackerbox deployed on Netlify.
            </p>
            <p className="text-gray-600">
              We're currently working on making our full application compatible with Netlify's hosting environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
