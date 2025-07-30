import { detectClaims } from './nlp';
import { checkFactSources } from './sources';
import { summarizeFact } from './summary';
import { synthesizeSpeech } from './tts';

export async function runFactCheck(claim: string) {
  // 1. NLP Claim Detection
  const claims = await detectClaims(claim);
  if (!claims.length) return { error: "No factual claim detected." };

  // 2. Get sources from web/academic/news
  const sources = await checkFactSources(claim);

  // 3. AI Summary
  const verdict = await summarizeFact(claim, sources);

  // 4. TTS (optional, for podcast feedback)
  const ttsAudio = await synthesizeSpeech(verdict.summary);

  return {
    claim,
    verdict: verdict.status,      // "True", "False", "Uncertain"
    summary: verdict.summary,
    confidence: verdict.confidence,
    sources,
    ttsAudio, // could be base64 or URL
  };
}