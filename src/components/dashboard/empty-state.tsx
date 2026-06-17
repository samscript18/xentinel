import type { ReactNode } from "react";
import { Radar } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="surface-subtle flex min-h-56 flex-col items-center justify-center rounded-lg p-8 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
        {icon ?? <Radar className="h-5 w-5" aria-hidden />}
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
