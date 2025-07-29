import { useState } from "react";

// Example: replace with your API/WebSocket logic
export function useFactCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function checkFact(claim: string) {
    setLoading(true);
    setResult(null);
    // Call your backend server
    const res = await fetch("/api/factcheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return { loading, result, checkFact };
}