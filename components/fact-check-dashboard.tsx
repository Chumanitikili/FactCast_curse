import React from "react";
import { useState, useEffect } from "react";
import { Shield, MessageSquare, ExternalLink, Share2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { format } from "date-fns";
import { speakText } from "@/lib/engines/tts";

interface FactCheck {
  claim: string;
  sources: any[];
  summary: string;
  confidence: number;
  timestamp: Date;
  sessionId: string;
}

interface FactCheckDashboardProps {
  sessionId: string;
}

interface Source {
  type: string;
  url: string;
  title: string;
  credibility: number;
}

interface FactCheckResult {
  claim: string;
  summary: string;
  confidence: number;
  sources: Source[];
}

export function FactCheckDashboard({ sessionId }: FactCheckDashboardProps) {
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const { sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    const handleNewFactCheck = (data: FactCheck) => {
      setFactChecks((prev) => [data, ...prev]);
    };

    const handleShare = async () => {
      try {
        setIsSharing(true);
        const shareData = {
          title: "TruthCast Fact-Checks",
          text: factChecks
            .map(
              (fc) => `
                Claim: ${fc.claim}
                Summary: ${fc.summary}
                Confidence: ${fc.confidence * 100}%
                Sources: ${fc.sources.map((s) => s.title).join(", ")}
              `
            )
            .join("\n\n"),
        };

        if (navigator.share) {
          await navigator.share(shareData);
        }
      } catch (error) {
        console.error("Error sharing fact-checks:", error);
      } finally {
        setIsSharing(false);
      }
    };

    // Listen for new fact-checks from WebSocket
    if (isConnected) {
      const message = {
        type: "subscribe",
        payload: { sessionId },
      };
      sendMessage(message);
    }

    return () => {
      // Cleanup WebSocket subscription
      if (isConnected) {
        const message = {
          type: "unsubscribe",
          payload: { sessionId },
        };
        sendMessage(message);
      }
    };
  }, [sessionId, isConnected, sendMessage]);

  const handleSave = async () => {
    try {
      const message = {
        type: "save_session",
        payload: {
          sessionId,
          factChecks,
        },
      };
      sendMessage(message);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const handleReadSources = async (factCheck: FactCheck) => {
    try {
      const message = {
        type: "read_sources",
        payload: {
          sessionId,
          factCheckId: factCheck.timestamp.toString(),
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
          Fact-Check Dashboard
        </CardTitle>
        <CardDescription>Recent fact-checks and their sources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {factChecks.map((fc) => (
            <div
              key={fc.timestamp.toString()}
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
                <span className="text-sm text-zinc-400 ml-auto">
                  {format(fc.timestamp, "MMM d, yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm text-zinc-400">{fc.summary}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReadSources(fc)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Sources
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          ))}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
