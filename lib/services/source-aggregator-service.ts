import axios from 'axios';
import { scoreSource } from '@/lib/services/source-verification-service'; // Assuming this service exists
import { scrapeWebsite } from '@/lib/utils/scraper'; // Assuming this utility exists
import Parser from 'rss-parser'; // For parsing RSS feeds
import * as cheerio from 'cheerio'; // For scraping (used in wikipediaSummary)

// Import types
import type { FactCheckClaim, VerificationSource } from '../types/multi-modal'; // Adjust import path if necessary


// API Keys from environment - Including all requested keys
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY; // Added back
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Added back
const COHERE_API_KEY = process.env.COHERE_API_KEY; // Added back
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN; // Added back (using API_TOKEN as in claim-detector)
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY; // Added back
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY; // Added back (assuming this name)
const SPOTIFY_API_KEY = process.env.SPOTIFY_API_KEY; // Added back (assuming this name)

const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Used for Google CSE
const NEWS_API_KEY = process.env.NEWSAPI_KEY;
const MEDIASTACK_API_KEY = process.env.MEDIASTACK_API_KEY;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const CURRENTSAPI_KEY = process.env.CURRENTSAPI_KEY;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;


// Universal aggregator fallback (from scripts/universal-news-aggregator.ts) - Keep this structure
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

// Keep existing helper function for checking relevance against RSS feed items
function isRelevant(item: any, claim: string): boolean { // Added return type
  const text = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
  // **TODO: Enhance relevance checking beyond simple keyword matching**
  // Consider using NLP to understand the semantic meaning of the claim and item.
  return claim.split(' ').some(word => text.includes(word.toLowerCase()));
}

// Keep existing function for fetching Wikipedia summary
async function wikipediaSummary(claim: string): Promise<VerificationSource[]> { // Added return type
  const search = encodeURIComponent(claim);
  // Using Google CSE might be a better approach for targeted Wikipedia search
  // or use the Wikipedia API directly for structured data.
  const url = `https://en.wikipedia.org/w/index.php?search=${search}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    // This extracts the first search result link. Need to scrape that page.
    const firstResult = $('.mw-search-result-heading a').attr('href');
    if (firstResult) {
      const pageUrl = `https://en.wikipedia.org${firstResult}`;
      const page = await axios.get(pageUrl);
      const $page = cheerio.load(page.data);
      // Extracts the first paragraph as a summary - might not be accurate or comprehensive
      const summary = $page('p').first().text();

       // Map to VerificationSource interface
       const wikiSource: VerificationSource = {
            id: `wikipedia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: pageUrl,
            title: $page('h1').text(),
            type: 'encyclopedia',
            domain: 'en.wikipedia.org',
            credibilityScore: 85, // Assign a default credibility score for Wikipedia
            excerpt: summary,
            publishDate: undefined, // Wikipedia pages don't have a single publish date
            reliability: "high", // General assessment for Wikipedia (can be debated)
            bias: "unknown", // Or attempt to assess bias if needed
       };
      return [wikiSource];
    }
  } catch (error) {
      console.error("Error fetching Wikipedia summary:", error);
  }
  return [];
}

// Keep existing universal aggregator - can be used as a fallback
async function universalAggregator(claim: string): Promise<VerificationSource[]> { // Added return type
  const allResults: VerificationSource[] = []; // Specify type
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const relevantItems = parsed.items.filter(item => isRelevant(item, claim));

      // Map RSS items to VerificationSource interface
      allResults.push(...relevantItems.map((item: any) => ({ // Specify item type
        id: `rss_${feed.source}_${item.guid || item.link || Date.now()}`, // Use guid or link for ID
        url: item.link,
        title: item.title,
        type: feed.type,
        source: feed.source, // Original source name
        domain: new URL(item.link).hostname, // Extract domain
        credibilityScore: 0, // **TODO: Implement credibility scoring for RSS sources**
        excerpt: item.contentSnippet || '', // Use contentSnippet as excerpt
        publishDate: item.pubDate ? new Date(item.pubDate).toISOString() : undefined, // Parse and format date
        reliability: "unknown", // **TODO: Determine reliability based on score**
        bias: "unknown", // **TODO: Determine bias if possible**
      } as VerificationSource))); // Cast to VerificationSource
    } catch (error) {
        console.error(`Error fetching or parsing RSS feed ${feed.url}:`, error);
    }
  }
  const wiki = await wikipediaSummary(claim);
  allResults.push(...wiki);

  // **TODO: Implement proper deduplication and initial credibility scoring here**
  // The original universalAggregator applied scoreSource here.
  // Consider applying a basic score or marking for later detailed scoring.
  const deduped = Array.from(new Map(allResults.map(s => [s.url, s])).values());

   // **TODO: Apply basic scoring or processing if needed before detailed aggregation**
   // For now, just returning deduped. Detailed scoring and selection happens in the main aggregateSources.

  return deduped; // Return deduplicated basic sources
}


// Real API integrations - Integrate the search functions here
// **TODO: Implement functions for searching each API**
// Copy those functions (searchNewsAPI, searchMediastack, searchGNews, searchCurrentsAPI, searchGoogleCSE, searchTwitter) here.


async function searchNewsAPI(claimText: string): Promise<VerificationSource[]> {
    if (!NEWS_API_KEY) {
        console.warn("NEWS_API_KEY not set. Skipping NewsAPI search.");
        return [];
    }
    try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: claimText,
                apiKey: NEWS_API_KEY,
                language: 'en',
                sortBy: 'relevancy'
            }
        });
        return response.data.articles.map((article: any) => ({
            id: `newsapi_${article.source.id || article.source.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            url: article.url,
            domain: new URL(article.url).hostname,
            credibilityScore: 0, // Will be calculated later
            sourceType: "news",
            excerpt: article.description,
            publishDate: article.publishedAt,
            reliability: "unknown",
            bias: "unknown",
        })) as VerificationSource[];
    } catch (error) {
        console.error("Error fetching from NewsAPI:", error);
        return [];
    }
}

async function searchMediastack(claimText: string): Promise<VerificationSource[]> {
     if (!MEDIASTACK_API_KEY) {
        console.warn("MEDIASTACK_API_KEY not set. Skipping Mediastack search.");
        return [];
    }
    try {
        const response = await axios.get('http://api.mediastack.com/v1/news', {
            params: {
                access_key: MEDIASTACK_API_KEY,
                keywords: claimText,
                languages: 'en',
                sort: 'relevance'
            }
        });
         return response.data.data.map((article: any) => ({
            id: `mediastack_${article.source || article.title}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            url: article.url,
            domain: new URL(article.url).hostname,
            credibilityScore: 0, // Will be calculated later
            sourceType: "news",
            excerpt: article.description,
            publishDate: article.published_at, // Note: Different field name
            reliability: "unknown",
            bias: "unknown",
         })) as VerificationSource[];

    } catch (error) {
        console.error("Error fetching from Mediastack:", error);
        return [];
    }
}

async function searchGNews(claimText: string): Promise<VerificationSource[]> {
     if (!GNEWS_API_KEY) {
        console.warn("GNEWS_API_KEY not set. Skipping GNews search.");
        return [];
    }
    try {
        const response = await axios.get('https://gnews.io/api/v4/search', {
            params: {
                q: claimText,
                token: GNEWS_API_KEY,
                lang: 'en',
                sortby: 'relevance'
            }
        });
         return response.data.articles.map((article: any) => ({
            id: `gnews_${article.source.name || article.title}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            url: article.url,
            domain: new URL(article.url).hostname,
            credibilityScore: 0, // Will be calculated later
            sourceType: "news",
            excerpt: article.description,
            publishDate: article.publishedAt,
            reliability: "unknown",
            bias: "unknown",
         })) as VerificationSource[];
    } catch (error) {
        console.error("Error fetching from GNews:", error);
        return [];
    }
}

async function searchCurrentsAPI(claimText: string): Promise<VerificationSource[]> {
    if (!CURRENTSAPI_KEY) {
        console.warn("CURRENTSAPI_API_KEY not set. Skipping CurrentsAPI search.");
        return [];
    }
    try {
        const response = await axios.get('https://api.currentsapi.services/v1/search', {
            params: {
                keywords: claimText,
                apiKey: CURRENTSAPI_KEY,
                language: 'en',
                sort_by: 'relevancy'
            }
        });
         return response.data.news.map((article: any) => ({
            id: `currentsapi_${article.id || article.title}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            url: article.url,
            domain: new URL(article.url).hostname,
            credibilityScore: 0, // Will be calculated later
            sourceType: "news",
            excerpt: article.description,
            publishDate: article.published,
            reliability: "unknown",
            bias: "unknown",
         })) as VerificationSource[];
    } catch (error) {
        console.error("Error fetching from CurrentsAPI:", error);
        return [];
    }
}


async function searchGoogleCSE(claimText: string): Promise<VerificationSource[]> {
     if (!GOOGLE_CSE_ID || !GOOGLE_API_KEY) {
        console.warn("GOOGLE_CSE_ID or GOOGLE_API_KEY not set. Skipping Google CSE search.");
        return [];
    }
    try {
        const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
            params: {
                q: claimText,
                cx: GOOGLE_CSE_ID,
                key: GOOGLE_API_KEY,
                // Add other parameters for refining search (e.g., siteSearch, dateRestrict)
            }
        });
         return response.data.items.map((item: any) => ({
            id: `googlecse_${item.title}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            url: item.link,
            domain: new URL(item.link).hostname,
            credibilityScore: 0, // Will be calculated later
            sourceType: "other", // Google CSE can return various types
            excerpt: item.snippet,
            publishDate: undefined, // Google CSE may not provide publish date directly
            reliability: "unknown",
            bias: "unknown",
         })) as VerificationSource[];

    } catch (error) {
        console.error("Error fetching from Google CSE:", error);
        return [];
    }
}

async function searchTwitter(claimText: string): Promise<VerificationSource[]> {
     if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
        console.warn("TWITTER_API_KEY or TWITTER_API_SECRET not set. Skipping Twitter search.");
        return [];
    }
    // **TODO: Implement Twitter API integration using a library like 'twitter-api-v2'**
    // Initialize the Twitter client and perform relevant search queries.
    // Process the results and map to VerificationSource[].
    console.warn("Twitter API integration is not yet implemented.");
    return []; // Placeholder
}

// **TODO: Add functions for other source types (Academic, Government, etc.)**
// Example: searchPubMed, searchGoogleScholar, fetchGovernmentData


// --- Main Source Aggregation Function ---

export async function aggregateSources(claim: FactCheckClaim): Promise<VerificationSource[]> {
    let allSources: VerificationSource[] = [];

    // Include results from the universal aggregator (RSS and Wikipedia)
    const universalResults = await universalAggregator(claim.text);
    allSources.push(...universalResults);

    // Run searches from other APIs concurrently
    const [newsapiResults, mediastackResults, gnewsResults, currentsapiResults, googlecseResults, twitterResults] = await Promise.all([
        searchNewsAPI(claim.text),
        searchMediastack(claim.text),
        searchGNews(claim.text),
        searchCurrentsAPI(claim.text),
        searchGoogleCSE(claim.text),
        searchTwitter(claim.text), // Assuming searchTwitter is implemented
        // **TODO: Add calls for other source types here (e.g., searchPubMed(claim.text))**
    ]);

    allSources = [
        ...allSources, // Include universal results
        ...newsapiResults,
        ...mediastackResults,
        ...gnewsResults,
        ...currentsapiResults,
        ...googlecseResults,
        ...twitterResults,
        // **TODO: Include results from other source types**
    ];

    // **TODO: Implement robust deduplication logic**
    // Deduplicate sources by a unique identifier (e.g., URL).
    const dedupedSources = Array.from(new Map(allSources.map(source => [source.url, source])).values());


    // **TODO: Implement detailed credibility scoring and ranking**
    // Use the scoreSource function (or similar logic) to assign credibility scores
    // to all fetched and deduplicated sources.
    // Then, rank the sources based on relevance to the claim and their credibility score.
    const scoredSources = dedupedSources.map(source => ({
        ...source,
        credibilityScore: scoreSource(source.url, source.type) // Assuming scoreSource takes url and type
        // **TODO: Refine this scoring based on source characteristics and content**
    }));


    // **TODO: Select the top 3 most relevant and credible sources**
    // Sort the scored sources based on a combination of relevance and credibility.
    // Relevance could be determined by how well the source's excerpt or title matches the claim.
    const rankedSources = scoredSources.sort((a, b) => {
        // Example sorting (replace with your actual ranking logic)
        // Prioritize higher credibility and higher relevance (you need to calculate relevance)
        // This basic relevance check using isRelevant is not ideal for ranking, enhance this.
        const relevanceA = isRelevant(a, claim.text) ? 1 : 0;
        const relevanceB = isRelevant(b, claim.text) ? 1 : 0;

        if (b.credibilityScore !== a.credibilityScore) {
            return b.credibilityScore - a.credibilityScore; // Sort by credibility (descending)
        }
        return relevanceB - relevanceA; // Then by relevance (descending)
    });


    // Select the top 3
    const top3Sources = rankedSources.slice(0, 3);

    return top3Sources; // Return the aggregated, scored, ranked, and filtered top 3 sources
}

// **TODO: Implement helper functions for detailed credibility scoring, ranking, and deduplication refinement**
// function calculateDetailedCredibilityScore(source: VerificationSource): number { ... }
// function calculateRelevance(source: VerificationSource, claimText: string): number { ... }
// function refineDeduplication(sources: VerificationSource[]): VerificationSource[] { ... }
