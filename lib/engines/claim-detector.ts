import axios from 'axios';

export async function detectClaims(text: string) {
  // Example: call local ML model or HuggingFace inference API
  const resp = await axios.post(process.env.NLP_API_URL, { text });
  return resp.data.claims;
}