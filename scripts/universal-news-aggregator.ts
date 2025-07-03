import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';

const parser = new Parser();

// List of public RSS feeds (global + South African)
const RSS_FEEDS = [
  // Global
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', type: 'news', source: 'NYT' },
  { url: 'https://www.theguardian.com/world/rss', type: 'news', source: 'Guardian' },
  // South Africa
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

// Simple keyword match for claim relevance
function isRelevant(item: any, claim: string) {
  const text = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
  return claim.split(' ').some(word => text.includes(word.toLowerCase()));
}

// Scrape Wikipedia summary (no API key needed)
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

// Main aggregator
export async function universalAggregator(claim: string) {
  const allResults: any[] = [];
  // RSS feeds
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
  // Wikipedia
  const wiki = await wikipediaSummary(claim);
  allResults.push(...wiki);
  // Deduplicate by URL
  const deduped = Array.from(new Map(allResults.map(s => [s.url, s])).values());
  return deduped;
}

// Example usage (uncomment to run directly)
// (async () => {
//   const results = await universalAggregator('South African elections');
//   console.log(results);
// })(); 