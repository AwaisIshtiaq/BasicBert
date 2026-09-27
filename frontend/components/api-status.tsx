"use client";

import { useEffect, useState } from "react";
import { checkHealth, getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "checking" | "online" | "offline";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let alive = true;

    const probe = async () => {
      const ok = await checkHealth();
      if (alive) setStatus(ok ? "online" : "offline");
    };

    probe();
    const id = setInterval(probe, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const label =
    status === "online"
      ? "API connected"
      : status === "offline"
        ? "API offline"
        : "Checking API…";

  return (
    <span
      className="chip !py-1.5"
      title={`${label} — ${getApiUrl()}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2">
        {status === "online" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-70" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            status === "online" && "bg-positive",
            status === "offline" && "bg-negative",
            status === "checking" && "bg-muted-foreground animate-pulse-soft",
          )}
        />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
