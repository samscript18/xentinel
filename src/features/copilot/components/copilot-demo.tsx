"use client";

import { Bot, BrainCircuit, Loader2, Send, ShieldAlert, User } from "lucide-react";
import { useState } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnalystResponse } from "@/features/copilot/components/analyst-response";
import { useCopilotChat } from "@/hooks/use-copilot-chat";
import { useSelectedWallet } from "@/hooks/use-selected-wallet";
import type { ChatMessage } from "@/types/risk";

const starters = [
  "Is my money safe right now?",
  "Which position worries you most?",
  "Are smart wallets exiting anything?",
  "What happens if a dependency breaks?",
  "What is my safest yield option?"
];

export function CopilotDemo() {
  const chat = useCopilotChat();
  const walletAddress = useSelectedWallet();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "chat_initial",
      role: "assistant",
      content: "Ask a portfolio risk question and Xentinel will respond with an analyst-style view of what deserves attention.",
      createdAt: new Date().toISOString()
    }
  ]);

  function sendMessage(message: string) {
    const content = message.trim();

    if (!content) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    chat.mutate({ message: content, walletAddress }, {
      onSuccess: (response) => {
        setMessages((current) => [...current, response.data.message]);
      },
      onError: () => {
        setMessages((current) => [
          ...current,
          {
            id: `error_${Date.now()}`,
            role: "assistant",
            content: "I could not complete that risk review right now. Please try again in a moment.",
            createdAt: new Date().toISOString()
          }
        ]);
      }
    });
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="AI Chat Co-Pilot"
        title="Ask what you should pay attention to."
        description="Ask daily risk questions and receive analyst-style responses grounded in portfolio safety, stress scenarios, panic signals, contagion paths, and smart money movement."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Ask Anything" value="5" detail="Starter risk questions" icon={<BrainCircuit className="h-4 w-4" />} tone="violet" />
        <MetricCard label="Risk Context" value="Ready" detail="Portfolio, stress, panic, contagion, smart money" icon={<Bot className="h-4 w-4" />} tone="cyan" />
        <MetricCard label="Protection Ideas" value="Actionable" detail="Clear next steps for risk review" icon={<ShieldAlert className="h-4 w-4" />} tone="green" />
      </div>

      <section className="surface-panel rounded-3xl p-5">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="rounded-md border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-violet-100">
              Risk analyst
            </span>
            <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">
              Portfolio-aware
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Responses are constrained to risk analysis and avoid guarantees or financial advice.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {starters.map((question) => (
            <button
              key={question}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-muted-foreground transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:text-white"
              onClick={() => sendMessage(question)}
              disabled={chat.isPending}
            >
              {question}
            </button>
          ))}
        </div>

        <div className="mt-6 h-[460px] space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-4">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                    <Bot className="h-4 w-4" aria-hidden />
                  </div>
                ) : null}
                <div className={`max-w-2xl rounded-2xl border p-4 ${isUser ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/[0.045] text-muted-foreground"}`}>
                  {!isUser ? (
                    <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1">Risk analyst</span>
                      <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1">Portfolio context</span>
                    </div>
                  ) : null}
                  {isUser ? <p className="text-sm leading-6">{message.content}</p> : <AnalystResponse content={message.content} />}
                </div>
                {isUser ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white">
                    <User className="h-4 w-4" aria-hidden />
                  </div>
                ) : null}
              </div>
            );
          })}
          {chat.isPending ? (
            <div className="flex items-center gap-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-50">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-100" aria-hidden />
              Reviewing risk context and drafting an analyst response...
            </div>
          ) : null}
        </div>

        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask: Is my money safe right now?"
            aria-label="AI Co-Pilot prompt"
          />
          <Button type="submit" className="gap-2" disabled={chat.isPending}>
            {chat.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Send
          </Button>
        </form>
      </section>
    </div>
  );
}
