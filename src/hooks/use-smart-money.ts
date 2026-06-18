"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { SmartMoneyResponse } from "@/types/api";

export function useSmartMoney(walletAddress?: string) {
  return useQuery({
    queryKey: ["smart-money", walletAddress],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await apiClient.get<SmartMoneyResponse>("/api/smart-money", {
        params: walletAddress ? { walletAddress } : undefined
      });
      return response.data;
    }
  });
}

export function useAddSmartWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { walletAddress: string; label?: string }) => {
      await apiClient.post("/api/smart-money", input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["smart-money"] });
    }
  });
}
