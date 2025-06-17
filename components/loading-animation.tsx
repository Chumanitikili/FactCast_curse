"use client"

import { Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface LoadingAnimationProps {
  size?: "small" | "medium" | "large"
  showText?: boolean
  text?: string
  className?: string
}

export function LoadingAnimation({
  size = "medium",
  showText = true,
  text = "Loading",
  className,
}: LoadingAnimationProps) {
  const [dots, setDots] = useState(".")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "."
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-10 w-10",
    large: "h-16 w-16",
  }

  const textSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-xl",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        <Shield className={cn("text-emerald-500 animate-pulse", sizeClasses[size])} />
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
      </div>
      {showText && (
        <div className={cn("mt-4 text-zinc-400 font-medium", textSizeClasses[size])}>
          {text}
          {dots}
        </div>
      )}
    </div>
  )
}
