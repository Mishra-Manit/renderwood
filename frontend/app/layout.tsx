import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, VT323, Space_Mono, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323" })
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono" })
const playfairDisplay = Playfair_Display({ weight: "700", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-playfair" })

export const metadata: Metadata = {
  title: "RenderWood - AI Video Editor",
  description: "AI-powered promptable video editor with nostalgic Windows XP aesthetics",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${vt323.variable} ${spaceMono.variable} ${playfairDisplay.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
