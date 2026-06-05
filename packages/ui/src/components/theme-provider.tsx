"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  attribute?: React.ComponentProps<typeof NextThemesProvider>["attribute"];
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
  attribute,
  enableSystem,
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute || "class"}
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem={enableSystem}
    >
      {children}
    </NextThemesProvider>
  );
}
