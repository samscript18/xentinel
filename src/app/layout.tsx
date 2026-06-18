import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: siteUrl,
	applicationName: "Xentinel",
	title: {
		default: "Xentinel | AI-Powered DeFi Risk Co-Pilot",
		template: "%s | Xentinel",
	},
	description: "Know your risk. Watch the smart money. Stay ahead of the panic with an AI-powered DeFi risk command center.",
	keywords: ["Xentinel", "DeFi risk", "Xerberus", "Smart Money Sentinel", "AI risk copilot", "Vibe Buildathon"],
	authors: [{ name: "Xentinel" }],
	creator: "Xentinel",
	openGraph: {
		title: "Xentinel | AI-Powered DeFi Risk Co-Pilot",
		description: "Analyze wallet risk, stress test positions, watch smart money, detect panic signals, and ask an AI risk Co-Pilot.",
		url: "/",
		siteName: "Xentinel",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Xentinel | AI-Powered DeFi Risk Co-Pilot",
		description: "Know your risk. Watch the smart money. Stay ahead of the panic.",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${poppins.className} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
