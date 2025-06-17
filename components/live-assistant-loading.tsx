"use client"

import { Shield, Mic, MessageSquare, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

export function LiveAssistantLoading() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">TruthCast Live Assistant</h1>
            <p className="text-zinc-400">Multi-modal voice and text fact-checking for live podcasts</p>
          </div>

          <div className="h-10 w-40 bg-zinc-800 rounded-md animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Voice Controls Skeleton */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="h-5 w-5 text-emerald-500" />
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-full bg-zinc-800 rounded-md mb-4 animate-pulse" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-full bg-zinc-800 rounded animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Manual Input Skeleton */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-full bg-zinc-800 rounded-md mb-4 animate-pulse" />
            <div className="h-10 w-full bg-emerald-500/30 rounded-md mb-4 animate-pulse" />
            <div className="grid grid-cols-2 gap-2 mt-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-zinc-800 rounded animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Results Skeleton */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-emerald-500" />
              <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse" />
            </div>

            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-16 w-16 text-emerald-500/30 mb-4" />
              <motion.div
                className="h-12 w-12 rounded-full border-2 border-emerald-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
              <p className="mt-4 text-zinc-500">Connecting to TruthCast servers...</p>
            </div>
          </div>
        </div>

        {/* Status Bar Skeleton */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-20 bg-zinc-800 rounded animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
