"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mic, MessageSquare, Volume2, Smartphone, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Multi-Modal Interaction Examples</h1>
          <p className="text-zinc-400 text-lg max-w-3xl mx-auto">
            See how podcasters use voice commands and text input for seamless fact-checking with exactly 3 sources and
            under 3-second response times.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scenario 1: Voice-Activated Fact-Check */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-emerald-500" />
                Voice-Activated Fact-Check
              </CardTitle>
              <CardDescription>During live recording with private audio feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">Podcaster says:</p>
                  <p className="text-sm">"I heard that coffee consumption has increased by 400% since 2010"</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-400 mb-1">Voice Command:</p>
                  <p className="text-sm">"Hey FactBot, check that coffee stat"</p>
                </div>

                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm font-medium text-purple-400 mb-1">
                    AI Voice Response (8 seconds, through earbuds):
                  </p>
                  <p className="text-sm">
                    "That's incorrect. Coffee consumption actually grew about 15% globally since 2010, not 400%. I'm
                    showing three sources on your screen now."
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-sm font-medium mb-2">Visual Display (simultaneous):</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge className="bg-red-500/10 text-red-500">FALSE (95% confidence)</Badge>
                    </div>
                    <p>📊 ACTUAL: ~15% growth 2010-2023</p>
                    <div className="space-y-1">
                      <p>📚 SOURCES (3 required):</p>
                      <p>1. International Coffee Organization (ICO) - 98% credible</p>
                      <p>2. USDA Coffee Market Report - 95% credible</p>
                      <p>3. Statista Global Coffee Statistics - 87% credible</p>
                    </div>
                    <p className="text-zinc-500">⚡ Processed in 2.1 seconds</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenario 2: Text-Based Manual Query */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Text-Based Manual Query
              </CardTitle>
              <CardDescription>Manual verification via companion app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">Podcaster types in companion app:</p>
                  <p className="text-sm">"renewable energy percentage US 2023"</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-400 mb-1">AI Response Options:</p>
                  <div className="space-y-1 text-sm">
                    <p>📱 Visual: Detailed fact-check display</p>
                    <p>🔊 Voice: "Renewables provided 21.4% of US electricity in 2023"</p>
                    <p>🔄 Both: Synchronized text + audio delivery</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-sm font-medium mb-2">Enhanced Result:</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge className="bg-green-500/10 text-green-500">VERIFIED (92% confidence)</Badge>
                    </div>
                    <p>📊 21.4% of US electricity from renewables in 2023</p>
                    <div className="space-y-1">
                      <p>📚 DIVERSE SOURCES:</p>
                      <p>1. U.S. Energy Information Administration - Government (99% credible)</p>
                      <p>2. Lawrence Berkeley National Lab - Academic (96% credible)</p>
                      <p>3. Reuters Energy Report - News (89% credible)</p>
                    </div>
                    <p className="text-zinc-500">⚡ Processed in 1.8 seconds</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm font-medium text-purple-400 mb-1">Follow-up Voice Command:</p>
                  <p className="text-sm">"Read me the sources"</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    AI: "Source one: U.S. Energy Information Administration reports..."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenario 3: Hybrid Real-Time + Manual */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-purple-500" />
                Hybrid Real-Time + Manual
              </CardTitle>
              <CardDescription>Auto-detection with voice confirmation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-400 mb-1">AI detects claim automatically:</p>
                  <p className="text-sm">"Electric cars produce zero emissions"</p>
                  <p className="text-xs text-zinc-400 mt-1">🔔 Visual Alert: ⚠️ Potential fact-check needed</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-400 mb-1">Podcaster voice command:</p>
                  <p className="text-sm">"FactBot, is that accurate?"</p>
                </div>

                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm font-medium text-purple-400 mb-1">AI Voice Response:</p>
                  <p className="text-sm">
                    "It's partially correct. Electric cars produce zero direct emissions, but electricity generation may
                    involve emissions. Check your screen for the full breakdown."
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-sm font-medium mb-2">Enhanced Analysis:</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <Badge className="bg-orange-500/10 text-orange-500">PARTIAL (78% confidence)</Badge>
                    </div>
                    <div className="space-y-1">
                      <p>⚠️ CONTRADICTIONS FOUND:</p>
                      <p>• EPA vs. Union of Concerned Scientists: Direct vs. lifecycle emissions</p>
                      <p>❓ UNCERTAINTIES:</p>
                      <p>• Grid electricity source varies by region</p>
                    </div>
                    <div className="space-y-1">
                      <p>📚 3 SOURCES ANALYZED:</p>
                      <p>1. EPA Vehicle Emissions - Government (97% credible)</p>
                      <p>2. MIT Energy Study - Academic (94% credible)</p>
                      <p>3. Bloomberg Green Report - News (85% credible)</p>
                    </div>
                    <p className="text-zinc-500">⚡ Processed in 2.7 seconds</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenario 4: Mobile Companion */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-orange-500" />
                Mobile Companion
              </CardTitle>
              <CardDescription>Seamless cross-device fact-checking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">Podcaster on mobile:</p>
                  <p className="text-sm">"Quick check: Is the Great Wall visible from space?"</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-400 mb-1">Mobile Response:</p>
                  <p className="text-sm">Instant visual + optional voice playback through connected devices</p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-sm font-medium mb-2">Mobile Display:</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge className="bg-red-500/10 text-red-500">MYTH (99% confidence)</Badge>
                    </div>
                    <p>🚫 The Great Wall is NOT visible from space with naked eye</p>
                    <div className="space-y-1">
                      <p>📚 AUTHORITATIVE SOURCES:</p>
                      <p>1. NASA Official Statement - Government (99% credible)</p>
                      <p>2. Astronaut Chris Hadfield - Expert (96% credible)</p>
                      <p>3. National Geographic - Media (91% credible)</p>
                    </div>
                    <p className="text-zinc-500">⚡ Processed in 1.4 seconds</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Key Features Demonstrated</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="font-semibold mb-2">⚡ Sub-3-Second Response</h3>
              <p className="text-sm text-zinc-400">All fact-checks complete in under 3 seconds for real-time use</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="font-semibold mb-2">📚 Exactly 3 Sources</h3>
              <p className="text-sm text-zinc-400">Every fact-check backed by precisely 3 diverse, credible sources</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="font-semibold mb-2">🎙️ Multi-Modal Interface</h3>
              <p className="text-sm text-zinc-400">
                Voice commands, text input, and visual displays work seamlessly together
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Try FactBot Now</Button>
        </div>
      </div>
    </div>
  )
}
