"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { StressTestingResponse } from "@/types/api";

export function useStressTesting(walletAddress?: string) {
  return useQuery({
    queryKey: ["stress-testing", walletAddress],
    queryFn: async () => {
      const response = await apiClient.get<StressTestingResponse>("/api/stress-testing", {
        params: walletAddress ? { walletAddress } : undefined
      });
      return response.data;
    }
  });
}
