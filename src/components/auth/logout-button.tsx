"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="text-gray-600 hover:text-red-600 hover:border-red-600"
    >
      Logout
    </Button>
  );
} 