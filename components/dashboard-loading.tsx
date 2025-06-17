"use client"

import { Shield } from "lucide-react"
import { motion } from "framer-motion"

export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center">
          <Shield className="h-8 w-8 text-emerald-500 mr-2" />
          <h1 className="text-3xl font-bold">TruthCast</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          <h2 className="mt-6 text-2xl font-bold">Loading Dashboard</h2>
          <p className="mt-2 text-zinc-400">Preparing your fact-checking workspace...</p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-lg bg-zinc-900 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
