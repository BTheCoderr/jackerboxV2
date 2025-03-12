// Add dynamic export to ensure proper server-side rendering
export const dynamic = 'force-dynamic';

import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect("/");
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Jackerbox</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Join the Jackerbox community</h1>
              <p className="text-gray-600">
                Create an account to start renting equipment or listing your own items for rent.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Verified users</h3>
                  <p className="text-sm text-gray-500">
                    Our community is built on trust and verification
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Secure payments</h3>
                  <p className="text-sm text-gray-500">
                    Your transactions are protected with secure payment processing
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-1">
            <RegisterForm />
          </div>
        </div>
      </main>
    </div>
  );
} 