"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ContagionResponse } from "@/types/api";

export function useContagion(walletAddress?: string) {
  return useQuery({
    queryKey: ["contagion", walletAddress],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await apiClient.get<ContagionResponse>("/api/contagion", {
        params: walletAddress ? { walletAddress } : undefined
      });
      return response.data;
    }
  });
}
