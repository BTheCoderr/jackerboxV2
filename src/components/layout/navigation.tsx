"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Search, PlusCircle, MessageSquare, User } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/browse",
      label: "Browse",
      icon: Search,
    },
    {
      href: "/list",
      label: "List",
      icon: PlusCircle,
    },
    {
      href: "/messages",
      label: "Messages",
      icon: MessageSquare,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 