"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

/** Sonner toaster that follows the active color scheme. */
export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="bottom-right"
      theme={resolvedTheme === "light" ? "light" : "dark"}
      richColors
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border bg-surface text-foreground shadow-soft font-sans text-sm",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
