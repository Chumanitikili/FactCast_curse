import axios from 'axios';
import { SourceResult } from './wikipedia';

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

export async function fetchNewsApiResults(claim: string): Promise<SourceResult[]> {
  if (!NEWSAPI_KEY) {
    console.error('Missing NEWSAPI_KEY in environment variables');
    return [];
  }
  const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(claim)}&language=en&sortBy=relevancy&pageSize=3&apiKey=${NEWSAPI_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    const articles = response.data.articles || [];
    return articles.slice(0, 3).map((article: any) => ({
      title: article.title,
      url: article.url,
      excerpt: article.description || article.content || '',
      domain: article.source?.name || 'newsapi',
      credibilityScore: 80, // NewsAPI sources are generally credible, but can be scored per domain
    }));
  } catch (error) {
    console.error('NewsAPI fetch error:', error);
    return [];
  }
} 