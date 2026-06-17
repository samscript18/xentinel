"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export const selectedWalletStorageKey = "xentinel:selected-wallet";

export function rememberSelectedWallet(walletAddress: string) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = walletAddress.trim();

  if (trimmed) {
    window.localStorage.setItem(selectedWalletStorageKey, trimmed);
  }
}

export function useSelectedWallet() {
  const account = useAccount();
  const [storedWallet, setStoredWallet] = useState<string | undefined>(undefined);

  useEffect(() => {
    setStoredWallet(window.localStorage.getItem(selectedWalletStorageKey) ?? undefined);

    function syncWallet() {
      setStoredWallet(window.localStorage.getItem(selectedWalletStorageKey) ?? undefined);
    }

    window.addEventListener("storage", syncWallet);
    window.addEventListener("xentinel:selected-wallet", syncWallet);

    return () => {
      window.removeEventListener("storage", syncWallet);
      window.removeEventListener("xentinel:selected-wallet", syncWallet);
    };
  }, []);

  return account.address ?? storedWallet;
}

export function publishSelectedWallet(walletAddress: string) {
  rememberSelectedWallet(walletAddress);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("xentinel:selected-wallet"));
  }
}
