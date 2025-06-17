"use client"

import { useState, useEffect } from "react"
import { MobileSplashScreen } from "@/components/mobile-splash-screen"
import { MobileCompanionContent } from "@/components/mobile-companion-content"

export default function MobileCompanionPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <MobileSplashScreen />
  }

  return <MobileCompanionContent />
}
