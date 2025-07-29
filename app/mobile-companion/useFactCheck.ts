import { useState } from "react";

export function useFactCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function checkFact(claim: string) {
    setLoading(true);
    setResult(null);
    // Adjust endpoint as needed for your backend server
    const res = await fetch("https://your-api-endpoint.com/api/factcheck", {
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