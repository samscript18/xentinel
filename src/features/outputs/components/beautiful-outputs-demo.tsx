"use client";

import { AlertTriangle, BarChart3, Download, FileText, Loader2, Radio, ShieldCheck } from "lucide-react";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { useSelectedWallet } from "@/hooks/use-selected-wallet";
import { useBeautifulOutputs } from "@/hooks/use-beautiful-outputs";
import { cn } from "@/lib/utils/cn";

const artifactIcons = {
  pdf: FileText,
  chart: BarChart3,
  alert: Radio
};

const statusStyles = {
  ready: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  queued: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  unavailable: "border-amber-300/20 bg-amber-300/10 text-amber-100"
};

const statusLabels = {
  ready: "ready",
  queued: "queued",
  unavailable: "pending"
};

const severityStyles = {
  medium: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  high: "border-orange-300/25 bg-orange-300/10 text-orange-100",
  critical: "border-red-300/25 bg-red-300/10 text-red-100"
};

export function BeautifulOutputsDemo() {
  const walletAddress = useSelectedWallet();
  const { data: response, isLoading, refetch } = useBeautifulOutputs(walletAddress);
  const outputs = response?.meta.source === "unavailable" ? undefined : response?.data;
  const pdfArtifact = outputs?.artifacts.find((artifact) => artifact.kind === "pdf");

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Beautiful Outputs"
        title="Shareable risk intelligence, not another raw data dump."
        description="Generate or preview polished risk reports, chart visuals, and rating-drift alerts that make portfolio risk easy to explain."
      />

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Preparing report preview and risk visuals...
        </div>
      ) : null}

      {response?.meta.source === "unavailable" ? (
        <LiveDataUnavailable
          title="No report ready yet"
          description="Analyze a wallet in Portfolio Guardian or connect a wallet, then return here to generate shareable risk briefs, visuals, and alerts."
          onRetry={() => void refetch()}
        />
      ) : null}

      {outputs ? (
        <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Report Status" value={outputs.reportStatus} detail={outputs.reportId ?? "local preview"} icon={<FileText className="h-4 w-4" />} tone="violet" />
        <MetricCard label="Rating Drift Alerts" value={String(outputs.ratingDriftAlerts.length)} detail="AAA-D movement surfaced" icon={<AlertTriangle className="h-4 w-4" />} tone="amber" />
        <MetricCard label="Risk Visuals" value={outputs.artifacts.some((artifact) => artifact.kind === "chart") ? "Ready" : "Pending"} detail="Charts appear when available" icon={<BarChart3 className="h-4 w-4" />} tone="cyan" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="surface-panel rounded-lg p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Report preview</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Xentinel Wallet Risk Brief</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                A polished summary of wallet risk score, highest-risk positions, stress-test impact, panic/outflow alerts,
                contagion path, and smart money comparison.
              </p>
            </div>
            <span className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]", statusStyles[outputs.reportStatus === "generated" ? "ready" : outputs.reportStatus])}>
              {outputs.reportStatus}
            </span>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Report state</p>
                <p className="mt-2 text-3xl font-semibold text-white">{outputs.reportStatus}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Report ID</p>
                <p className="mt-2 break-words text-lg font-semibold text-white">{outputs.reportId ?? "Pending"}</p>
                <p className="mt-2 text-sm text-muted-foreground">Generated reports appear here when available.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Artifacts</p>
                <p className="mt-2 text-sm leading-6 text-cyan-100">{outputs.artifacts.length} output surface{outputs.artifacts.length === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {outputs.reportUrl ? (
              <a href={outputs.reportUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/90">
                <Download className="h-4 w-4" aria-hidden />
                Open Generated Report
              </a>
            ) : (
              <Button className="gap-2" disabled>
                <Download className="h-4 w-4" aria-hidden />
                Download Report
              </Button>
            )}
            <p className="text-sm leading-6 text-muted-foreground">
              {pdfArtifact?.description}
            </p>
          </div>
        </section>

        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Output Artifacts</h2>
          <div className="mt-5 space-y-3">
            {outputs.artifacts.map((artifact) => {
              const Icon = artifactIcons[artifact.kind];

              return (
                <article key={artifact.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{artifact.title}</h3>
                        <span className={cn("rounded border px-2 py-0.5 text-[11px] uppercase tracking-[0.14em]", statusStyles[artifact.status])}>
                          {statusLabels[artifact.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{artifact.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="surface-panel rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-white">Rating-Drift Alerts</h2>
          {outputs.ratingDriftAlerts.length > 0 ? (
          <div className="mt-5 space-y-3">
            {outputs.ratingDriftAlerts.map((alert) => (
              <article key={alert.id} className={cn("rounded-lg border p-4", severityStyles[alert.severity])}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{alert.protocol}</span>
                    <RiskBadge rating={alert.from} />
                    <span className="text-sm opacity-70">to</span>
                    <RiskBadge rating={alert.to} />
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] opacity-80">{alert.severity}</span>
                </div>
                <p className="mt-3 text-sm leading-6 opacity-85">{alert.summary}</p>
              </article>
            ))}
          </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Rating-drift alerts appear here when available.</p>
          )}
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-muted-foreground">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" aria-hidden />
          <p>{outputs.disclaimer}</p>
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}
