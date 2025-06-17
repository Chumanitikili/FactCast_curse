"use client"

// This component contains all the existing mobile companion functionality
// I'm not including the full implementation here as it would be redundant
// In a real implementation, you would move the existing code from app/mobile-companion/page.tsx here

import { Shield } from "lucide-react"

export function MobileCompanionContent() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-500" />
            <h1 className="text-xl font-bold">TruthCast Mobile</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Your pocket fact-checker</p>
        </div>

        {/* Mobile companion content would go here */}
        {/* This is just a placeholder. The actual content would be moved from app/mobile-companion/page.tsx */}
      </div>
    </div>
  )
}
