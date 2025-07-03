import axios from 'axios';
import { SourceResult } from './wikipedia';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

export async function fetchGoogleSearchResults(claim: string): Promise<SourceResult[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.error('Missing GOOGLE_API_KEY or GOOGLE_CSE_ID in environment variables');
    return [];
  }
  const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(claim)}&cx=${GOOGLE_CSE_ID}&key=${GOOGLE_API_KEY}&num=3`;
  try {
    const response = await axios.get(apiUrl);
    const items = response.data.items || [];
    return items.slice(0, 3).map((item: any) => ({
      title: item.title,
      url: item.link,
      excerpt: item.snippet,
      domain: (new URL(item.link)).hostname,
      credibilityScore: 70, // Can be improved with domain-based scoring
    }));
  } catch (error) {
    console.error('Google Search fetch error:', error);
    return [];
  }
} 