"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AppToaster } from "@/components/app-toaster";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange={false}
    >
      {children}
      <AppToaster />
    </NextThemesProvider>
  );
}
