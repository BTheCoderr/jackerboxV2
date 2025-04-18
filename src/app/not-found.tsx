import { Metadata } from "next";
import { ClientNotFoundPage } from "@/components/errors/ClientNotFoundPage";

export const metadata: Metadata = {
  title: '404 - Page Not Found | Jackerbox',
  description: 'The page you are looking for could not be found.',
};

// Server component that imports the client component
export default function NotFound() {
  return <ClientNotFoundPage />;
} 