"use client"

import { Shield } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LoadingIndicatorProps {
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function LoadingIndicator({ size = "md", className }: LoadingIndicatorProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Shield className={cn("text-emerald-500", sizeClasses[size])} />
      <motion.div
        className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
    </div>
  )
}
