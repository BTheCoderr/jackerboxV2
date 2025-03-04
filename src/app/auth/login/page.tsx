import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function LoginPage() {
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
              <h1 className="text-3xl font-bold">Rent equipment from people in your area</h1>
              <p className="text-gray-600">
                Jackerbox connects people who need equipment with those who have it.
                Join our community today!
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Find what you need</h3>
                  <p className="text-sm text-gray-500">
                    Search thousands of items available for rent
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Make extra money</h3>
                  <p className="text-sm text-gray-500">
                    Rent out your equipment when you're not using it
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-1">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
} 