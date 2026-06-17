"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { AnalyzeWalletResponse } from "@/types/api";

export function useAnalyzeWallet() {
  return useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await apiClient.post<AnalyzeWalletResponse>("/api/analyze-wallet", {
        walletAddress
      });

      return response.data;
    }
  });
}
