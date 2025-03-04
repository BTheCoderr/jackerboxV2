import Link from "next/link";

interface LogoProps {
  variant?: "default" | "white";
}

export function Logo({ variant = "default" }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        {/* Simple B&W Logo */}
        <div className="absolute w-8 h-8 bg-black transform rotate-45 translate-x-1 translate-y-1"></div>
        <div className="absolute w-4 h-4 bg-white transform rotate-45 translate-x-3 translate-y-0"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-white">
          <span className="transform -translate-y-1 -translate-x-1">J</span>
        </div>
      </div>
      <div className="font-bold text-xl">
        <span className={variant === "white" ? "text-white" : "text-black"}>jacker</span>
        <span className={variant === "white" ? "text-white" : "text-black"}>BOX</span>
      </div>
    </Link>
  );
} 