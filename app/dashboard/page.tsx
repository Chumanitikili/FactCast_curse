"use client"

import { useState, useEffect } from "react"
import { DashboardLoading } from "@/components/dashboard-loading"
import { DashboardContent } from "@/components/dashboard-content"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <DashboardLoading />
  }

  return <DashboardContent />
}
