import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export async function summarizeFact(claim: string, sources: any[]) {
  const prompt = `Claim: ${claim}
Sources: ${sources.map(s=>s.url).join(', ')}
Summarize verdict and confidence.`;
  const resp = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: prompt }]
  });
  // Parse resp to extract summary, verdict, confidence
  return {
    status: "True", // or "False"/"Uncertain"
    confidence: 95,
    summary: resp.choices[0].message.content
  };
}