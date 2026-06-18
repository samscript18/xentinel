"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { BeautifulOutputsResponse } from "@/types/api";

export function useBeautifulOutputs(walletAddress?: string) {
  return useQuery({
    queryKey: ["beautiful-outputs", walletAddress],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await apiClient.get<BeautifulOutputsResponse>("/api/outputs", {
        params: walletAddress ? { walletAddress } : undefined
      });
      return response.data;
    }
  });
}
