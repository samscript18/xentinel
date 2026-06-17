"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { AnalyzeWalletResponse } from "@/types/api";

export function useWalletAnalysis(walletAddress?: string) {
  return useQuery({
    queryKey: ["wallet-analysis-overview", walletAddress],
    queryFn: async () => {
      const response = await apiClient.get<AnalyzeWalletResponse>("/api/analyze-wallet", {
        params: walletAddress ? { walletAddress } : undefined
      });
      return response.data;
    }
  });
}
