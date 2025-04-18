"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "data-theme",
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Only access localStorage after component has mounted (client-side only)
  useEffect(() => {
    setMounted(true);
    // Once mounted, we can safely access localStorage
    const savedTheme = typeof window !== 'undefined' 
      ? (localStorage?.getItem(storageKey) as Theme) 
      : null;
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      root.setAttribute(attribute, systemTheme);
      return;
    }

    root.classList.add(theme);
    root.setAttribute(attribute, theme);
  }, [theme, attribute, enableSystem, mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    if (theme !== "system") {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey, mounted]);

  // Prevent flash of unstyled content during SSR
  // Only render children when mounted (client-side)
  if (!mounted) {
    return (
      <ThemeProviderContext.Provider {...props} value={{ ...initialState, theme: defaultTheme }}>
        {children}
      </ThemeProviderContext.Provider>
    );
  }

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}; 