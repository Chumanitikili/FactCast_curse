"use client"

import { Shield, Search, Database, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface FactCheckLoadingProps {
  claim?: string
  onComplete?: () => void
  autoComplete?: boolean
  autoCompleteTime?: number
}

export function FactCheckLoading({
  claim,
  onComplete,
  autoComplete = false,
  autoCompleteTime = 3000,
}: FactCheckLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = [
    { icon: Search, text: "Analyzing claim" },
    { icon: Database, text: "Searching sources" },
    { icon: Shield, text: "Verifying facts" },
    { icon: CheckCircle, text: "Generating results" },
  ]

  useEffect(() => {
    if (!autoComplete) return

    const stepTime = autoCompleteTime / steps.length

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval)
          if (onComplete) setTimeout(onComplete, 500)
          return prev
        }
        return prev + 1
      })
    }, stepTime)

    return () => clearInterval(interval)
  }, [autoComplete, autoCompleteTime, onComplete, steps.length])

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-zinc-900 border border-zinc-800">
      <Shield className="h-12 w-12 text-emerald-500 mb-4" />

      <h3 className="text-xl font-bold mb-2">Fact-Checking in Progress</h3>

      {claim && <p className="text-sm text-zinc-400 text-center mb-6 max-w-md">&quot;{claim}&quot;</p>}

      <div className="w-full max-w-md space-y-4 mt-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full mr-3 ${
                index <= currentStep ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              <step.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${index <= currentStep ? "text-white" : "text-zinc-500"}`}>
                  {step.text}
                </span>
                {index < currentStep && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                {index === currentStep && (
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`ml-4 mt-1 mb-1 w-px h-4 ${index < currentStep ? "bg-emerald-500" : "bg-zinc-800"}`} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-zinc-500">Searching multiple sources for verification...</div>
    </div>
  )
}
