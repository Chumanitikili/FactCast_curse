"use client"

// This component contains all the existing mobile companion functionality
// I'm not including the full implementation here as it would be redundant
// In a real implementation, you would move the existing code from app/mobile-companion/page.tsx here

import { useState, useEffect, useCallback } from "react";
import { Shield, Mic, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceService } from "@/lib/services/voice-service";
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text";
import { useVoiceCommands } from "@/lib/hooks/use-voice-commands";

interface FactCheckResult {
  claim: string;
  sources: unknown[];
  summary: string;
  confidence: number;
  timestamp: string;
}

interface Settings {
  mode: "voice_only" | "text_only" | "hybrid";
  voiceResponse: boolean;
  autoSave: boolean;
}

export function MobileCompanionContent() {
  const [textInput, setTextInput] = useState("");
  const [factChecks, setFactChecks] = useState<FactCheckResult[]>([]);
  const [settings, setSettings] = useState<Settings>({
    mode: "hybrid",
    voiceResponse: true,
    autoSave: true,
  });

  const voiceService = VoiceService.getInstance();

  // Speech-to-text and voice command integration
  const { transcript, listening, start, stop } = useSpeechToText();
  const { command, parameters, reset } = useVoiceCommands(transcript);

  const handleFactCheck = useCallback(async (content: string) => {
    try {
      setIsProcessing(true);
      
      // Send request to backend
      const response = await fetch("/api/multi-modal/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputType: textInput ? "text" : "voice",
          content,
          sessionId: localStorage.getItem("session_id") || Date.now().toString(),
        }),
      });

      const data = await response.json();
      setFactChecks((prev: FactCheckResult[]) => [...prev, ...data.claims]);

      // Generate voice response if enabled
      if (settings.voiceResponse && data.voiceResponse) {
        // Play voice response through device
        // Implementation depends on platform (web, mobile)
      }
    } catch (error) {
      console.error("Error fact-checking:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [settings.voiceResponse, textInput, factChecks]);

  const handleSave = useCallback(async () => {
    // Save current fact-checks to cloud
    try {
      await fetch("/api/multi-modal/session/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          factChecks,
          sessionId: localStorage.getItem("session_id"),
        }),
      });
    } catch (error) {
      console.error("Error saving fact-checks:", error);
    }
  }, [factChecks]);

  const handleShare = useCallback(async () => {
    // Share fact-checks via social media or email
    try {
      const shareData = {
        title: "TruthCast Fact-Checks",
        text: factChecks.map((fc: FactCheckResult) => `${fc.claim}: ${fc.summary}`).join("\n\n"),
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      }
    } catch (error) {
      console.error("Error sharing fact-checks:", error);
    }
  }, [factChecks]);

  const handleReadSources = useCallback(async () => {
    if (factChecks.length === 0) return;
    
    const latestFactCheck = factChecks[factChecks.length - 1];
    await voiceService.generateResponse({
      claims: [latestFactCheck],
      settings: { voiceType: "source-reader" },
    });
    // Play response
  }, [factChecks, voiceService]);

  // Handle detected voice command
  useEffect(() => {
    if (!command) return;
    if (command === "fact-check" && parameters?.claim) {
      handleFactCheck(parameters.claim);
      reset();
    } else if (command === "save") {
      handleSave();
      reset();
    } else if (command === "share") {
      handleShare();
      reset();
    } else if (command === "read-sources") {
      handleReadSources();
      reset();
    }
  }, [command, parameters, handleFactCheck, handleSave, handleShare, handleReadSources, reset]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-500" />
            <h1 className="text-xl font-bold">TruthCast Mobile</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Your pocket fact-checker</p>
        </div>

        {/* Voice Controls */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Controls
            </CardTitle>
            <CardDescription>
              {listening ? "Listening..." : "Tap to start voice commands"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={listening ? stop : start}
              className="w-full"
            >
              <Mic className="h-4 w-4 mr-2" />
              {listening ? "Stop Listening" : "Start Listening"}
            </Button>
            <div className="mt-2 text-xs text-zinc-400">
              <div>Transcript: {transcript}</div>
              <div>Detected Command: {command ? `${command} ${parameters?.claim || ""}` : "-"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Text Input */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Manual Fact-Check
            </CardTitle>
            <CardDescription>Enter claims to verify</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                placeholder="Enter claim to fact-check..."
                value={textInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextInput(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
              <Button
                onClick={() => handleFactCheck(textInput)}
                disabled={!textInput || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Fact-Check"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={settings.mode}
                onValueChange={(value: Settings["mode"]) => setSettings({ ...settings, mode: value })}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voice_only">Voice Only</SelectItem>
                  <SelectItem value="text_only">Text Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.voiceResponse}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, voiceResponse: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
                  />
                  <span>Enable Voice Responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, autoSave: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
                  />
                  <span>Auto Save</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fact-Check Results */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Fact-Checks</CardTitle>
          </CardHeader>
          <CardContent>
            {factChecks.map((fc: FactCheckResult, index: number) => (
              <div
                key={index}
                className="p-4 border-b border-zinc-800 last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  {fc.confidence >= 0.8 ? (
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                  ) : fc.confidence >= 0.5 ? (
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                  )}
                  <span className="font-medium">{fc.claim}</span>
                </div>
                <p className="text-sm text-zinc-400">{fc.summary}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReadSources()}
                  >
                    Read Sources
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
