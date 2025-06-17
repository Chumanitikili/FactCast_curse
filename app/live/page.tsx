"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Mic,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Settings,
  Zap,
} from "lucide-react"
import { RealTimeAudioProcessor } from "@/lib/realtime-audio"
import type { LiveSession, TranscriptSegment, LiveFactCheck, SessionSettings } from "@/lib/realtime-types"

export default function LiveFactCheckingPage() {
  const [session, setSession] = useState<LiveSession | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [factChecks, setFactChecks] = useState<LiveFactCheck[]>([])
  const [selectedFactCheck, setSelectedFactCheck] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [settings, setSettings] = useState<SessionSettings>({
    autoFactCheck: true,
    voiceActivation: true,
    hotkey: "KeyF",
    confidenceThreshold: 70,
    sourceTypes: ["news", "academic", "government"],
    maxSourcesPerCheck: 5,
    voiceOutput: true,
    realTimeTranscript: true,
  })

  const audioProcessor = useRef<RealTimeAudioProcessor | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll transcript
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

  const startSession = async () => {
    try {
      const sessionId = `session_${Date.now()}`

      // Initialize audio processor
      audioProcessor.current = new RealTimeAudioProcessor(sessionId, settings)
      await audioProcessor.current.initialize()

      // Setup callbacks
      audioProcessor.current.onTranscript((segment) => {
        setTranscript((prev) => [...prev, segment])
      })

      audioProcessor.current.onVoiceCommand((command) => {
        console.log("Voice command:", command)
      })

      // Create session
      const newSession: LiveSession = {
        id: sessionId,
        userId: "current_user",
        title: `Live Session ${new Date().toLocaleTimeString()}`,
        status: "active",
        startTime: new Date().toISOString(),
        transcript: [],
        factChecks: [],
        settings,
      }

      setSession(newSession)
      setIsRecording(true)
      audioProcessor.current.startRecording()
    } catch (error) {
      console.error("Failed to start session:", error)
      alert("Failed to start live session. Please check microphone permissions.")
    }
  }

  const stopSession = () => {
    if (audioProcessor.current) {
      audioProcessor.current.stopRecording()
      audioProcessor.current.cleanup()
      audioProcessor.current = null
    }

    setIsRecording(false)
    if (session) {
      setSession({ ...session, status: "stopped" })
    }
  }

  const pauseSession = () => {
    if (audioProcessor.current) {
      audioProcessor.current.stopRecording()
    }
    setIsRecording(false)
    if (session) {
      setSession({ ...session, status: "paused" })
    }
  }

  const resumeSession = () => {
    if (audioProcessor.current) {
      audioProcessor.current.startRecording()
    }
    setIsRecording(true)
    if (session) {
      setSession({ ...session, status: "active" })
    }
  }

  const handleManualFactCheck = async () => {
    if (!manualInput.trim()) return

    // Create mock fact check for demo
    const mockFactCheck: LiveFactCheck = {
      id: `fc_${Date.now()}`,
      segmentId: `seg_${Date.now()}`,
      claim: manualInput,
      timestamp: Date.now(),
      status: "processing",
      confidence: 0,
      verdict: "unverified",
      sources: [],
      perspectives: [],
      flagged: false,
    }

    setFactChecks((prev) => [...prev, mockFactCheck])
    setManualInput("")

    // Simulate processing
    setTimeout(() => {
      const completedFactCheck: LiveFactCheck = {
        ...mockFactCheck,
        status: "completed",
        confidence: 85,
        verdict: "verified",
        sources: [
          {
            id: "src1",
            title: "Scientific Study on Climate Change",
            url: "https://example.com/study",
            domain: "example.com",
            publishDate: "2024-01-15",
            reliability: 92,
            politicalLean: "center",
            sourceType: "academic",
            excerpt: "Research confirms the claim with high confidence...",
          },
        ],
        perspectives: [
          {
            id: "p1",
            sourceId: "src1",
            stance: "supports",
            explanation: "The academic source strongly supports this claim with peer-reviewed evidence.",
            relevanceScore: 95,
          },
        ],
        aiSummary: "Based on available academic sources, this claim is well-supported by scientific evidence.",
        flagged: false,
      }

      setFactChecks((prev) => prev.map((fc) => (fc.id === mockFactCheck.id ? completedFactCheck : fc)))
    }, 2000)
  }

  const getVerdictIcon = (verdict: LiveFactCheck["verdict"]) => {
    switch (verdict) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "disputed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "mixed":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getVerdictBadge = (verdict: LiveFactCheck["verdict"], confidence: number) => {
    const baseClasses = "text-xs font-medium"

    switch (verdict) {
      case "verified":
        return (
          <Badge className={`${baseClasses} bg-green-500/10 text-green-500 border-green-500/20`}>
            Verified ({confidence}%)
          </Badge>
        )
      case "disputed":
        return (
          <Badge className={`${baseClasses} bg-red-500/10 text-red-500 border-red-500/20`}>
            Disputed ({confidence}%)
          </Badge>
        )
      case "mixed":
        return (
          <Badge className={`${baseClasses} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`}>
            Mixed Evidence ({confidence}%)
          </Badge>
        )
      default:
        return (
          <Badge className={`${baseClasses} bg-gray-500/10 text-gray-500 border-gray-500/20`}>
            Unverified ({confidence}%)
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Live Fact-Checking Studio</h1>
            <p className="text-zinc-400">Real-time verification for your podcast</p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="border-zinc-700">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>

            {!session ? (
              <Button onClick={startSession} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                <Mic className="h-4 w-4 mr-2" />
                Start Live Session
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {session.status === "active" ? (
                  <Button onClick={pauseSession} variant="outline" className="border-yellow-500 text-yellow-500">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : session.status === "paused" ? (
                  <Button onClick={resumeSession} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                ) : null}

                <Button onClick={stopSession} variant="outline" className="border-red-500 text-red-500">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Session Status */}
        {session && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-500 rounded-full" />
                    )}
                    <span className="text-sm font-medium">
                      {session.status === "active" ? "Recording" : session.status === "paused" ? "Paused" : "Stopped"}
                    </span>
                  </div>

                  <Separator orientation="vertical" className="h-4" />

                  <div className="text-sm text-zinc-400">Session: {session.title}</div>

                  <Separator orientation="vertical" className="h-4" />

                  <div className="text-sm text-zinc-400">
                    Started: {new Date(session.startTime).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Mic className="h-4 w-4" />
                    {transcript.length} segments
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {factChecks.length} fact-checks
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Transcript */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Live Transcript
              </CardTitle>
              <CardDescription>Real-time speech-to-text with automatic fact-checking</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-3">
                  {transcript.map((segment, index) => (
                    <div key={segment.id} className="p-3 rounded-lg bg-zinc-800/50">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-zinc-500">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(segment.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed">{segment.text}</p>

                      {/* Show related fact-checks */}
                      {factChecks
                        .filter((fc) => fc.segmentId === segment.id)
                        .map((factCheck) => (
                          <div key={factCheck.id} className="mt-3 p-2 rounded border border-zinc-700">
                            <div className="flex items-center gap-2 mb-1">
                              {getVerdictIcon(factCheck.verdict)}
                              {getVerdictBadge(factCheck.verdict, factCheck.confidence)}
                            </div>
                            <p className="text-xs text-zinc-400">{factCheck.claim}</p>
                          </div>
                        ))}
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </ScrollArea>

              {/* Manual Input */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a claim to fact-check manually..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleManualFactCheck()}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <Button
                    onClick={handleManualFactCheck}
                    disabled={!manualInput.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Press Ctrl+{settings.hotkey.replace("Key", "")} for voice activation, or type manually
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fact-Check Results */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Fact-Check Results
              </CardTitle>
              <CardDescription>Real-time verification with multi-source analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {factChecks.map((factCheck) => (
                    <div
                      key={factCheck.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedFactCheck === factCheck.id
                          ? "border-emerald-500 bg-emerald-500/5"
                          : "border-zinc-700 hover:border-zinc-600"
                      }`}
                      onClick={() => setSelectedFactCheck(selectedFactCheck === factCheck.id ? null : factCheck.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        {getVerdictBadge(factCheck.verdict, factCheck.confidence)}
                        <span className="text-xs text-zinc-500">
                          {new Date(factCheck.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-sm font-medium mb-2 line-clamp-2">{factCheck.claim}</p>

                      {factCheck.status === "processing" ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          {factCheck.aiSummary && <p className="text-xs text-zinc-400 mb-3">{factCheck.aiSummary}</p>}

                          {selectedFactCheck === factCheck.id && (
                            <div className="mt-4 space-y-3">
                              <Separator />

                              <div>
                                <h4 className="text-sm font-medium mb-2">Sources ({factCheck.sources.length})</h4>
                                <div className="space-y-2">
                                  {factCheck.sources.map((source) => (
                                    <div key={source.id} className="p-2 rounded bg-zinc-800/50">
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs font-medium truncate">{source.title}</span>
                                        <a
                                          href={source.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-500 hover:text-emerald-400"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span>{source.domain}</span>
                                        <span>•</span>
                                        <span>{source.reliability}% reliable</span>
                                        <span>•</span>
                                        <span className="capitalize">{source.politicalLean}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {factCheck.perspectives.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Perspectives</h4>
                                  <div className="space-y-2">
                                    {factCheck.perspectives.map((perspective) => (
                                      <div key={perspective.id} className="p-2 rounded bg-zinc-800/50">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                              perspective.stance === "supports"
                                                ? "border-green-500/50 text-green-500"
                                                : perspective.stance === "disputes"
                                                  ? "border-red-500/50 text-red-500"
                                                  : "border-gray-500/50 text-gray-500"
                                            }`}
                                          >
                                            {perspective.stance}
                                          </Badge>
                                          <span className="text-xs text-zinc-500">
                                            {perspective.relevanceScore}% relevant
                                          </span>
                                        </div>
                                        <p className="text-xs text-zinc-400">{perspective.explanation}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  {factChecks.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No fact-checks yet</p>
                      <p className="text-xs">Start speaking or type a claim to begin</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Verified</p>
                  <p className="text-2xl font-bold">{factChecks.filter((fc) => fc.verdict === "verified").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Disputed</p>
                  <p className="text-2xl font-bold">{factChecks.filter((fc) => fc.verdict === "disputed").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Mixed</p>
                  <p className="text-2xl font-bold">{factChecks.filter((fc) => fc.verdict === "mixed").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Avg Confidence</p>
                  <p className="text-2xl font-bold">
                    {factChecks.length > 0
                      ? Math.round(factChecks.reduce((sum, fc) => sum + fc.confidence, 0) / factChecks.length)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
