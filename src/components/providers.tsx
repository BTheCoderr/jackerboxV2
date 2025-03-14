"use client";

import { ReactNode } from "react";
import { SessionProvider } from "@/components/providers/session-provider";
import { SocketStatusProvider } from "@/components/providers/SocketStatusProvider";
import { SSEProvider } from "@/components/providers/SSEProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SocketStatusProvider>
        <SSEProvider>
          {children}
        </SSEProvider>
      </SocketStatusProvider>
    </SessionProvider>
  );
} 