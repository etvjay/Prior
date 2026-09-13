import type { Metadata } from "next";
import "./globals.css";
import "./participation-create-responsive.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Web3Providers } from "./Web3Providers";
export const metadata: Metadata = { title: "PRIOR | One bounded intent. Many markets", description: "A persistent, bounded intent carrying belief and evidence across recurring DreamDEX Event Contracts." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Web3Providers><a className="skip-link" href="#main">Skip to content</a>{children}</Web3Providers></body></html>; }
