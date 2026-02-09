import type React from "react"
import type { Metadata } from "next"
import { VT323, Space_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "../components/ui/sonner"
import "./globals.css"

const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323" })
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono" })

export const metadata: Metadata = {
  title: "Renderwood",
  description: "AI-powered promptable video editor with nostalgic Windows XP aesthetics",
  generator: "renderwood",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${vt323.variable} ${spaceMono.variable}`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
