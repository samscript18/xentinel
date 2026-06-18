"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { RiskMigrationResponse } from "@/types/api";

export function useRiskMigration(walletAddress?: string) {
  return useQuery({
    queryKey: ["risk-migration", walletAddress],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await apiClient.get<RiskMigrationResponse>("/api/risk-migration", {
        params: walletAddress ? { walletAddress } : undefined
      });
      return response.data;
    }
  });
}
