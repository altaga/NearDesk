import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearDesk — Sovereign Edge AI Operator Desk for NEAR Protocol",
  description:
    "Autonomous Edge AI Node on NVIDIA Jetson powered by NEAR Chain Signatures, NEAR Intents & TEE Verifiable Cloud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-near-black text-near-textPrimary antialiased selection:bg-near-green selection:text-black">
        {children}
      </body>
    </html>
  );
}
