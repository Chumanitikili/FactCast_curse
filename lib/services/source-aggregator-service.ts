import axios from 'axios';
import { scoreSource } from '@/lib/services/source-verification-service';
import { scrapeWebsite } from '@/lib/utils/scraper';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

// API Keys from environment
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const MEDIASTACK_API_KEY = process.env.MEDIASTACK_API_KEY;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const CURRENTSAPI_KEY = process.env.CURRENTSAPI_KEY;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

// Universal aggregator fallback (from scripts/universal-news-aggregator.ts)
const parser = new Parser();
const RSS_FEEDS = [
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', type: 'news', source: 'NYT' },
  { url: 'https://www.theguardian.com/world/rss', type: 'news', source: 'Guardian' },
  { url: 'https://www.news24.com/rss', type: 'za-news', source: 'News24' },
  { url: 'https://www.iol.co.za/cmlink/1.640', type: 'za-news', source: 'IOL' },
  { url: 'https://www.timeslive.co.za/rss/?section=news', type: 'za-news', source: 'TimesLIVE' },
  { url: 'https://mg.co.za/feed/', type: 'za-news', source: 'Mail & Guardian' },
  { url: 'https://ewn.co.za/rss', type: 'za-news', source: 'EWN' },
  { url: 'https://www.dailymaverick.co.za/feed/', type: 'za-news', source: 'Daily Maverick' },
  { url: 'http://www.sabc.co.za/news/rss/feeds/topstories', type: 'za-news', source: 'SABC News' },
  { url: 'https://www.channel24.co.za/rss', type: 'za-entertainment', source: 'Channel24' },
  { url: 'https://www.news24.com/drum/rss', type: 'za-entertainment', source: 'Drum' },
  { url: 'https://www.sowetanlive.co.za/rss/?section=entertainment', type: 'za-entertainment', source: 'SowetanLIVE' },
  { url: 'https://www.supersport.com/rss', type: 'za-sport', source: 'SuperSport' },
];

function isRelevant(item: any, claim: string) {
  const text = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
  return claim.split(' ').some(word => text.includes(word.toLowerCase()));
}

async function wikipediaSummary(claim: string) {
  const search = encodeURIComponent(claim);
  const url = `https://en.wikipedia.org/w/index.php?search=${search}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const firstResult = $('.mw-search-result-heading a').attr('href');
    if (firstResult) {
      const pageUrl = `https://en.wikipedia.org${firstResult}`;
      const page = await axios.get(pageUrl);
      const $page = cheerio.load(page.data);
      const summary = $page('p').first().text();
      return [{ url: pageUrl, title: $page('h1').text(), type: 'encyclopedia', source: 'Wikipedia', summary }];
    }
  } catch {}
  return [];
}

async function universalAggregator(claim: string) {
  const allResults: any[] = [];
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const relevant = parsed.items.filter(item => isRelevant(item, claim));
      allResults.push(...relevant.map(item => ({
        url: item.link,
        title: item.title,
        type: feed.type,
        source: feed.source,
      })));
    } catch {}
  }
  const wiki = await wikipediaSummary(claim);
  allResults.push(...wiki);
  const deduped = Array.from(new Map(allResults.map(s => [s.url, s])).values());
  return deduped.map(s => ({ ...s, credibility: scoreSource(s.url, s.type) }));
}

// Real API integrations
async function googleSearch(claim: string) {
  if (!GOOGLE_CSE_ID || !GOOGLE_API_KEY) return [];
  try {
    const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: claim,
        num: 5,
      },
    });
    return (res.data.items || []).map((item: any) => ({
      url: item.link,
      title: item.title,
      type: 'news',
      source: 'Google Search',
    }));
  } catch {
    return [];
  }
}

async function newsApiSearch(claim: string) {
  if (!NEWS_API_KEY) return [];
  try {
    const res = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: claim,
        apiKey: NEWS_API_KEY,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: 5,
      },
    });
    return (res.data.articles || []).map((a: any) => ({
      url: a.url,
      title: a.title,
      type: 'news',
      source: 'NewsAPI',
    }));
  } catch {
    return [];
  }
}

async function mediaStackSearch(claim: string) {
  if (!MEDIASTACK_API_KEY) return [];
  try {
    const res = await axios.get('http://api.mediastack.com/v1/news', {
      params: {
        access_key: MEDIASTACK_API_KEY,
        keywords: claim,
        languages: 'en',
        limit: 5,
      },
    });
    return (res.data.data || []).map((a: any) => ({
      url: a.url,
      title: a.title,
      type: 'news',
      source: 'MediaStack',
    }));
  } catch {
    return [];
  }
}

async function gNewsSearch(claim: string) {
  if (!GNEWS_API_KEY) return [];
  try {
    const res = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: claim,
        token: GNEWS_API_KEY,
        lang: 'en',
        max: 5,
      },
    });
    return (res.data.articles || []).map((a: any) => ({
      url: a.url,
      title: a.title,
      type: 'news',
      source: 'GNews',
    }));
  } catch {
    return [];
  }
}

async function currentsApiSearch(claim: string) {
  if (!CURRENTSAPI_KEY) return [];
  try {
    const res = await axios.get('https://api.currentsapi.services/v1/search', {
      params: {
        keywords: claim,
        apiKey: CURRENTSAPI_KEY,
        language: 'en',
        limit: 5,
      },
    });
    return (res.data.news || []).map((a: any) => ({
      url: a.url,
      title: a.title,
      type: 'news',
      source: 'CurrentsAPI',
    }));
  } catch {
    return [];
  }
}

// Main aggregator with real APIs and fallback
export async function aggregateSources(claim: string) {
  let all: any[] = [];
  let usedFallback = false;
  
  try {
    // Try real API integrations
    const [google, newsApi, mediaStack, gNews, currents] = await Promise.all([
      googleSearch(claim),
      newsApiSearch(claim),
      mediaStackSearch(claim),
      gNewsSearch(claim),
      currentsApiSearch(claim),
    ]);
    
    all = [...google, ...newsApi, ...mediaStack, ...gNews, ...currents];
    
    // If no results from APIs, use fallback
    if (!all.length) {
      all = await universalAggregator(claim);
      usedFallback = true;
    }
  } catch (error) {
    console.warn('API aggregation failed, using fallback:', error);
    all = await universalAggregator(claim);
    usedFallback = true;
  }
  
  // Deduplicate by URL and add credibility scores
  const deduped = Array.from(new Map(all.map(s => [s.url, s])).values());
  return deduped.map(s => ({ 
    ...s, 
    credibility: s.credibility || scoreSource(s.url, s.type || 'news') 
  }));
} 