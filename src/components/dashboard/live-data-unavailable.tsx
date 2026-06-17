"use client";

import { PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveDataUnavailableProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function LiveDataUnavailable({
  title = "No risk data available yet",
  description = "Run an analysis to populate this module with risk intelligence.",
  onRetry
}: LiveDataUnavailableProps) {
  return (
    <section className="surface-panel rounded-3xl p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-cyan">
        <PlugZap className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button type="button" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </section>
  );
}
