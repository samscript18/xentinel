"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { WalletAnalysis } from "@/types/risk";

const progressiveQueryOptions = {
  retry: false,
  staleTime: 0,
  refetchOnWindowFocus: false
} as const;

export interface PortfolioIntrinsicSection {
  score: number;
  risks: string[];
}

export interface PortfolioSystemicSection {
  score: number;
  summary?: string;
  dependencies: Array<{
    name: string;
    category?: string;
    exposure?: number;
  }>;
}

export interface PortfolioScreenSection {
  positions: WalletAnalysis["positions"];
}

export function usePortfolioIntrinsic(walletAddress: string, enabled: boolean) {
  return useQuery({
    queryKey: ["portfolio-intrinsic", walletAddress],
    enabled: enabled && walletAddress.length > 0,
    ...progressiveQueryOptions,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PortfolioIntrinsicSection>>("/api/xerberus/intrinsic", {
        params: { walletAddress }
      });

      return response.data;
    }
  });
}

export function usePortfolioSystemic(walletAddress: string, enabled: boolean) {
  return useQuery({
    queryKey: ["portfolio-systemic", walletAddress],
    enabled: enabled && walletAddress.length > 0,
    ...progressiveQueryOptions,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PortfolioSystemicSection>>("/api/xerberus/systemic", {
        params: { walletAddress }
      });

      return response.data;
    }
  });
}

export function usePortfolioScreen(walletAddress: string, enabled: boolean) {
  return useQuery({
    queryKey: ["portfolio-screen", walletAddress],
    enabled: enabled && walletAddress.length > 0,
    ...progressiveQueryOptions,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PortfolioScreenSection>>("/api/xerberus/screen", {
        params: { walletAddress }
      });

      return response.data;
    }
  });
}
