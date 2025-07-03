"use client"

import { useState } from "react"
import { Shield, Mic, Loader2 } from "lucide-react"
import { FactCheckDashboard } from "@/components/fact-check-dashboard"
import { speakText } from "@/lib/engines/tts"

export function DashboardContent() {
  const [input, setInput] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleFactCheck() {
    setLoading(true)
    setError("")
    setResults([])
    try {
      const res = await fetch("/api/multi-modal/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input })
      })
      const data = await res.json()
      if (data.claims) setResults(data.claims)
      else setError(data.error || "No claims detected.")
    } catch (e) {
      setError("Error processing request.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white p-0 md:p-6 flex flex-col items-center justify-start font-sans">
      <div className="w-full max-w-5xl mx-auto mt-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/80 to-cyan-400/80 rounded-full p-2 shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1" style={{letterSpacing: '-0.02em'}}>TruthCast</h1>
            <p className="text-zinc-300 text-lg md:text-xl">Real-Time AI Fact-Checking for Podcasters</p>
          </div>
        </div>
        <div className="glassmorphism rounded-2xl shadow-2xl p-8 mb-8 flex flex-col md:flex-row gap-6 items-center bg-white/10 backdrop-blur-md border border-white/10">
          <div className="flex-1 w-full">
            <input
              className="w-full p-4 rounded-xl bg-zinc-900/80 border border-zinc-700 text-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="Type or paste a claim to fact-check (e.g. 'Coffee increases productivity by 400%')"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleFactCheck() }}
              disabled={loading}
            />
          </div>
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-400 text-black font-bold text-lg shadow-md hover:scale-105 transition disabled:opacity-60"
            onClick={handleFactCheck}
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
            Fact-Check
          </button>
        </div>
        {error && <div className="text-red-400 text-center mb-4">{error}</div>}
        <div className="mt-6">
          <FactCheckDashboard results={results} />
        </div>
      </div>
      <style jsx global>{`
        body {
          font-family: 'Inter', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }
        .glassmorphism {
          background: rgba(30, 41, 59, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
      `}</style>
    </div>
  )
}
