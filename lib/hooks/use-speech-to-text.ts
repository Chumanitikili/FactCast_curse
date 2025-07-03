import { useState, useRef, useCallback } from "react";

export function useSpeechToText({ onResult }: { onResult?: (transcript: string) => void } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    if (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        const t = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setTranscript(t);
        if (onResult) onResult(t);
      };
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.start();
      setListening(true);
    } else {
      // Fallback: call backend API for cloud STT (not implemented here)
      alert("Speech recognition not supported in this browser.");
    }
  }, [onResult]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, []);

  return { transcript, listening, start, stop };
} 