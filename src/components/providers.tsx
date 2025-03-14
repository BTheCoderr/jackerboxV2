"use client";

import { ReactNode } from "react";
import { SessionProvider } from "@/components/providers/session-provider";
import { SocketStatusProvider } from "@/components/providers/SocketStatusProvider";
import { SSEProvider } from "@/components/providers/SSEProvider";
import { MyStatsigProvider } from "@/components/statsig/StatsigProvider";
import { FeatureFlagProvider } from "@/components/feature-flags/FeatureFlagProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <MyStatsigProvider>
        <FeatureFlagProvider>
          <SocketStatusProvider>
            <SSEProvider>
              {children}
            </SSEProvider>
          </SocketStatusProvider>
        </FeatureFlagProvider>
      </MyStatsigProvider>
    </SessionProvider>
  );
} 