import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDate, formatCurrency, formatDateRange } from "./utils/format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export format utilities
export { formatDate, formatCurrency, formatDateRange };
