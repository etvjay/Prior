import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Prior — commit before reality does", description: "Live forecasting evidence across DreamDEX Event Contracts." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
