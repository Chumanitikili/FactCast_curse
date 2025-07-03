import { useState, useCallback } from "react";

const WAKE_WORD = "hey factbot";

export function useVoiceCommands(transcript: string) {
  const [command, setCommand] = useState<string | null>(null);
  const [parameters, setParameters] = useState<any>(null);

  const parseCommand = useCallback((t: string) => {
    const lower = t.toLowerCase();
    if (lower.includes(WAKE_WORD)) {
      // Simple intent extraction after wake word
      const afterWake = lower.split(WAKE_WORD)[1]?.trim() || "";
      if (afterWake.startsWith("check")) {
        setCommand("fact-check");
        setParameters({ claim: afterWake.replace("check", "").trim() });
      } else if (afterWake.startsWith("save")) {
        setCommand("save");
      } else if (afterWake.startsWith("share")) {
        setCommand("share");
      } else if (afterWake.startsWith("read")) {
        setCommand("read-sources");
      } else {
        setCommand("unknown");
        setParameters({ raw: afterWake });
      }
    } else {
      setCommand(null);
      setParameters(null);
    }
  }, []);

  // Parse on transcript change
  if (transcript) parseCommand(transcript);

  const reset = () => {
    setCommand(null);
    setParameters(null);
  };

  return { command, parameters, reset };
} 