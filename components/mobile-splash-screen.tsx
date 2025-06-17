"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"
import { motion } from "framer-motion"

interface MobileSplashScreenProps {
  onComplete?: () => void
  minDisplayTime?: number
}

export function MobileSplashScreen({ onComplete, minDisplayTime = 2000 }: MobileSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, minDisplayTime / 20)

    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) onComplete()
    }, minDisplayTime)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [minDisplayTime, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="w-full max-w-xs flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Shield className="h-20 w-20 text-emerald-500" />
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          >
            <Shield className="h-20 w-20 text-emerald-500" />
          </motion.div>
        </motion.div>

        <motion.h1
          className="mt-6 text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          TruthCast
        </motion.h1>

        <motion.p
          className="mt-2 text-sm text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Mobile Companion
        </motion.p>

        <motion.div
          className="mt-12 w-full h-1 bg-zinc-800 rounded-full overflow-hidden"
          initial={{ opacity: 0, width: "80%" }}
          animate={{ opacity: 1, width: "80%" }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

        <motion.p
          className="mt-4 text-xs text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          Connecting to TruthCast...
        </motion.p>
      </div>
    </div>
  )
}
