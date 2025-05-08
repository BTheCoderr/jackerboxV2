"use client";

import { ReactNode } from "react";
import { SessionProvider } from "@/components/providers/session-provider";
import { SocketStatusProvider } from "@/components/providers/SocketStatusProvider";
import { SSEProvider } from "@/components/providers/SSEProvider";
import { ClientOnlyProvider } from "@/components/providers/ClientOnlyProvider";
import { FeatureFlagProvider } from "@/components/feature-flags/FeatureFlagProvider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import CSRFTokenProvider from "@/components/CSRFTokenProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const content = (
    <FeatureFlagProvider children={children} />
  );

  return (
    <SessionProvider children={
      <ClientOnlyProvider children={
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          children={
            <CSRFTokenProvider children={
              <SocketStatusProvider children={
                <SSEProvider children={content} />
              } />
            } />
          }
        />
      } />
    } />
  );
} 