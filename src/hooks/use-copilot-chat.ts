"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ChatResponse } from "@/types/api";

interface CopilotChatRequest {
  message: string;
  walletAddress?: string;
}

export function useCopilotChat() {
  return useMutation({
    mutationFn: async ({ message, walletAddress }: CopilotChatRequest) => {
      const response = await apiClient.post<ChatResponse>("/api/chat", {
        message,
        walletAddress
      });

      return response.data;
    }
  });
}
