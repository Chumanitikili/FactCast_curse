import { useState } from "react";

export function useFactCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function checkFact(claim: string, audioFile?: File) {
    setLoading(true);
    setResult(null);
    let body: any = { claim };
    if (audioFile) {
      const base64 = await audioFile.arrayBuffer().then(b=>Buffer.from(b).toString('base64'));
      body = { audio: base64 };
    }
    const token = localStorage.getItem('jwt');
    const res = await fetch("/api/factcheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return { loading, result, checkFact };
}