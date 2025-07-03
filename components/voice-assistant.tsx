import { useState, useEffect } from "react";
import { Shield, Mic, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { VoiceService } from "@/lib/services/voice-service";
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text";
import { useVoiceCommands } from "@/lib/hooks/use-voice-commands";

interface VoiceAssistantProps {
  sessionId: string;
  settings: {
    mode: "voice_only" | "text_only" | "hybrid";
    voiceResponse: boolean;
    autoSave: boolean;
  };
  onFactCheck?: (claim: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  onReadSources?: () => void;
}

export function VoiceAssistant({ sessionId, settings, onFactCheck, onSave, onShare, onReadSources }: VoiceAssistantProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState("");
  const { sendMessage } = useWebSocket();
  const voiceService = VoiceService.getInstance();
  const { transcript: speechTranscript, listening, start, stop } = useSpeechToText();
  const { command, parameters, reset } = useVoiceCommands(speechTranscript);

  useEffect(() => {
    const recognition = new (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: unknown) => {
      const transcript = Array.from(event as SpeechRecognitionEvent)
        .map((result) => result[0].transcript)
        .join("");
      setVoiceResponse(transcript);
    };

    recognition.onend = () => {
      if (listening) {
        recognition.start();
      }
    };

    return () => {
      recognition.stop();
    };
  }, [listening]);

  // Handle detected voice command
  useEffect(() => {
    if (!command) return;
    if (command === "fact-check" && parameters?.claim) {
      onFactCheck?.(parameters.claim);
      reset();
    } else if (command === "save") {
      onSave?.();
      reset();
    } else if (command === "share") {
      onShare?.();
      reset();
    } else if (command === "read-sources") {
      onReadSources?.();
      reset();
    }
  }, [command, parameters, onFactCheck, onSave, onShare, onReadSources, reset]);

  const handleVoiceCommand = async (command: string) => {
    try {
      const { commandType, parameters } = await voiceService.processVoiceCommand(command);
      
      switch (commandType) {
        case "fact-check":
          await handleFactCheck(parameters.claim);
          break;
        case "save":
          await handleSave();
          break;
        case "share":
          await handleShare();
          break;
        case "read-sources":
          await handleReadSources();
          break;
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
    }
  };

  const handleFactCheck = async (claim: string) => {
    try {
      setIsProcessing(true);
      
      const message = {
        type: "fact_check",
        payload: {
          claim,
          sessionId,
          settings,
        },
      };
      
      sendMessage(message);
    } catch (error) {
      console.error("Error sending fact-check request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      const message = {
        type: "save_session",
        payload: {
          sessionId,
        },
      };
      
      sendMessage(message);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const handleShare = async () => {
    try {
      const message = {
        type: "share_fact_checks",
        payload: {
          sessionId,
        },
      };
      
      sendMessage(message);
    } catch (error) {
      console.error("Error sharing fact-checks:", error);
    }
  };

  const handleReadSources = async () => {
    try {
      const message = {
        type: "read_sources",
        payload: {
          sessionId,
        },
      };
      
      sendMessage(message);
    } catch (error) {
      console.error("Error reading sources:", error);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Voice Assistant
        </CardTitle>
        <CardDescription>
          {listening ? "Listening..." : "Tap to start voice commands"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button
              onClick={listening ? stop : start}
              className="w-full"
            >
              <Mic className="h-4 w-4 mr-2" />
              {listening ? "Stop Listening" : "Start Listening"}
            </Button>
            <div className="transcript">Transcript: {speechTranscript}</div>
            <div className="command">Detected Command: {command ? `${command} ${parameters?.claim || ""}` : "-"}</div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleVoiceCommand(speechTranscript)}
              disabled={!speechTranscript || isProcessing}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Process Command
            </Button>
            {voiceResponse && (
              <div className="mt-2 p-3 bg-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-400">{voiceResponse}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isProcessing}
            >
              Save Session
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={isProcessing}
            >
              Share
            </Button>
            <Button
              variant="outline"
              onClick={handleReadSources}
              disabled={isProcessing}
            >
              Read Sources
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
