import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeWebsite(url: string): Promise<{ title: string; text: string; meta: any }> {
  try {
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FactCastBot/1.0)' } });
    const $ = cheerio.load(data);
    const title = $('title').text();
    const meta: any = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      if (name) meta[name] = $(el).attr('content');
    });
    // Simple main text extraction
    let text = '';
    $('p').each((_, el) => { text += $(el).text() + '\n'; });
    text = text.trim();
    // TODO: For dynamic/JS sites, use Playwright
    return { title, text, meta };
  } catch (e) {
    return { title: '', text: '', meta: {} };
  }
} 