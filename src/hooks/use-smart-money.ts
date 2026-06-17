"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { SmartMoneyResponse } from "@/types/api";

export function useSmartMoney() {
  return useQuery({
    queryKey: ["smart-money"],
    queryFn: async () => {
      const response = await apiClient.get<SmartMoneyResponse>("/api/smart-money");
      return response.data;
    }
  });
}
