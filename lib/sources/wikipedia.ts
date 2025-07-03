import axios from 'axios';

export interface SourceResult {
  title: string;
  url: string;
  excerpt: string;
  domain: string;
  credibilityScore: number;
}

export async function fetchWikipediaResults(claim: string): Promise<SourceResult[]> {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(claim)}&utf8=&format=json`;
  try {
    const response = await axios.get(apiUrl);
    const results = response.data.query.search.slice(0, 3);
    return results.map((item: any) => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      excerpt: item.snippet.replace(/<[^>]+>/g, ''),
      domain: 'wikipedia.org',
      credibilityScore: 85, // Wikipedia is generally credible but not peer-reviewed
    }));
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return [];
  }
} 