import axios from 'axios';
import { SourceResult } from './wikipedia';

export async function fetchRedditResults(claim: string): Promise<SourceResult[]> {
  const apiUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(claim)}&sort=relevance&limit=3`;
  try {
    const response = await axios.get(apiUrl);
    const posts = response.data.data.children || [];
    return posts.slice(0, 3).map((post: any) => ({
      title: post.data.title,
      url: `https://reddit.com${post.data.permalink}`,
      excerpt: post.data.selftext || '',
      domain: 'reddit.com',
      credibilityScore: 50, // Social media, lower credibility
    }));
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return [];
  }
} 