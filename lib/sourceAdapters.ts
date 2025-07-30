import axios from 'axios';

export async function googleSearch(query: string) {
  // Use Google Programmable Search or SERP API
  const resp = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: { q: query, key: process.env.GOOGLE_API_KEY, cx: process.env.GOOGLE_CSE_ID }
  });
  return resp.data.items.map(item => ({ url: item.link, name: item.title, domain: new URL(item.link).hostname }));
}

export async function newsApiSearch(query: string) {
  const resp = await axios.get('https://newsapi.org/v2/everything', {
    params: { q: query, apiKey: process.env.NEWS_API_KEY }
  });
  return resp.data.articles.map(a => ({ url: a.url, name: a.title, domain: new URL(a.url).hostname }));
}

export async function academicApiSearch(query: string) {
  // Example: use Semantic Scholar API
  const resp = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
    params: { query: query, fields: 'title,url', limit: 3 }
  });
  return resp.data.data.map(p => ({ url: p.url, name: p.title, domain: new URL(p.url).hostname }));
}
