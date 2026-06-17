"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WalletInput() {
  const [walletAddress, setWalletAddress] = useState("");

  return (
    <form className="surface-panel flex flex-col gap-3 rounded-lg p-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Wallet address"
          className="pl-9"
          placeholder="Enter wallet address"
          value={walletAddress}
          onChange={(event) => setWalletAddress(event.target.value)}
        />
      </div>
      <Button className="gap-2 bg-primary shadow-glow">
        Analyze
      </Button>
    </form>
  );
}
