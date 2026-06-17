"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnectButton() {
	return <ConnectButton accountStatus={{ smallScreen: "avatar", largeScreen: "avatar" }} chainStatus="icon" showBalance={{ smallScreen: false, largeScreen: true }} label="Connect Wallet" />;
}
