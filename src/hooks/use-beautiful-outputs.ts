"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { BeautifulOutputsResponse } from "@/types/api";

export function useBeautifulOutputs(walletAddress?: string) {
  return useQuery({
    queryKey: ["beautiful-outputs", walletAddress],
    queryFn: async () => {
      const response = await apiClient.get<BeautifulOutputsResponse>("/api/outputs", {
        params: walletAddress ? { walletAddress } : undefined
      });
      return response.data;
    }
  });
}
