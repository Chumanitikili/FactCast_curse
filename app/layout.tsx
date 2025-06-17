import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SplashScreenProvider } from "@/components/splash-screen-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "TruthCast - Real-Time AI Fact-Checking for Podcasters",
  description:
    "Multi-modal AI assistant for instant podcast fact-checking with voice commands and 3-source verification.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SplashScreenProvider>{children}</SplashScreenProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
