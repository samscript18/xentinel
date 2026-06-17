"use client";

import { AlertTriangle, GitBranch, Network, Zap } from "lucide-react";
import ReactFlow, { Background, Controls, MarkerType, Position, type Edge, type Node } from "reactflow";
import { LiveDataUnavailable } from "@/components/dashboard/live-data-unavailable";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useContagion } from "@/hooks/use-contagion";
import { useSelectedWallet } from "@/hooks/use-selected-wallet";
import type { ContagionNode } from "@/types/risk";

function GraphNode({ node }: { node: ContagionNode }) {
  return (
    <div className="min-w-36 rounded-lg border border-white/15 bg-[#0b1020]/95 p-3 shadow-glow">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{node.label}</p>
        <RiskBadge rating={node.rating} className="min-w-10 px-2 py-0.5" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{node.category}</p>
    </div>
  );
}

const positions: Record<string, { x: number; y: number }> = {
  aave: { x: 0, y: 60 },
  usdc: { x: 0, y: 240 },
  curve: { x: 260, y: 150 },
  eigenlayer: { x: 260, y: 330 },
  pendle: { x: 540, y: 240 },
  wallet: { x: 820, y: 240 }
};

export function ContagionRadarDemo() {
  const walletAddress = useSelectedWallet();
  const { data: response, refetch } = useContagion(walletAddress);
  const map = response?.meta.source === "unavailable" ? undefined : response?.data;
  const criticalDependencies = map?.edges.map((edge) => `${edge.source} to ${edge.target}: ${edge.dependency}`) ?? [];
  const maxWeight = map?.edges.length ? Math.max(...map.edges.map((edge) => edge.weight)) : 0;

  const nodes: Node[] = map?.nodes.map((node) => ({
    id: node.id,
    position: positions[node.id] ?? { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      label: <GraphNode node={node} />
    },
    style: {
      background: "transparent",
      border: 0,
      padding: 0,
      width: "auto"
    }
  })) ?? [];

  const edges: Edge[] = map?.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.dependency,
    animated: edge.weight > 0.7,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#22d3ee" },
    style: { stroke: edge.weight > 0.7 ? "#a78bfa" : "#22d3ee", strokeWidth: 2 },
    labelStyle: { fill: "#cbd5e1", fontSize: 11 },
    labelBgStyle: { fill: "#0b1020", fillOpacity: 0.9 }
  })) ?? [];

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Contagion radar"
        title="Protocol dependency map"
        description="Trace how a failure or liquidity shock moves from shared infrastructure into concrete wallet exposure."
      />

      {response?.meta.source === "unavailable" ? (
        <LiveDataUnavailable
          title="No contagion map yet"
          description="Analyze a wallet in Portfolio Guardian or connect a wallet, then return here to view dependency paths and exposure chains."
          onRetry={() => void refetch()}
        />
      ) : null}

      {map ? (
        <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Contagion Risk Score" value={`${Math.round(maxWeight * 100)}/100`} detail="Highest dependency weight" icon={<Network className="h-4 w-4" />} tone="red" />
        <MetricCard label="Critical Path" value={`${map.highestRiskPath.length} nodes`} detail={map.highestRiskPath.join(" to ") || "No path returned"} icon={<GitBranch className="h-4 w-4" />} tone="amber" />
        <MetricCard label="Animated Edges" value={String(map.edges.filter((edge) => edge.weight > 0.7).length)} detail="Highest-weight exposure channels" icon={<Zap className="h-4 w-4" />} tone="cyan" />
      </div>

      <section className="surface-panel overflow-hidden rounded-lg">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Live Contagion Graph</h2>
          <p className="text-sm text-muted-foreground">Live dependency paths returned for the selected wallet or entity.</p>
        </div>
        <div className="h-[520px] bg-black/20">
          <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
            <Background color="rgba(255,255,255,0.14)" gap={22} />
            <Controls className="!border-white/10 !bg-[#0b1020] !text-white" />
          </ReactFlow>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Exposure Path Explanation</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The critical path below is built from live dependency relationships returned by the risk engine.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {map.highestRiskPath.map((item) => (
              <span key={item} className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">{item}</span>
            ))}
          </div>
        </section>

        <section className="surface-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">What happens if this breaks?</h2>
          <div className="mt-4 flex gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-200" aria-hidden />
            <p className="text-sm leading-6 text-muted-foreground">
              If a critical dependency weakens, connected positions can inherit higher systemic risk through shared infrastructure, liquidity, or collateral exposure.
            </p>
          </div>
        </section>
      </div>

      <section className="surface-panel rounded-lg p-5">
        <h2 className="text-lg font-semibold text-white">Critical Dependencies</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {criticalDependencies.map((dependency) => (
            <div key={dependency} className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-muted-foreground">
              {dependency}
            </div>
          ))}
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}
