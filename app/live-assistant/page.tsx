"use client"

import { useState, useEffect } from "react"
import { LiveAssistantLoading } from "@/components/live-assistant-loading"
import { LiveAssistantContent } from "@/components/live-assistant-content"

export default function LiveAssistantPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LiveAssistantLoading />
  }

  return <LiveAssistantContent />
}
