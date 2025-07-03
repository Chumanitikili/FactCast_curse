import axios from 'axios';
import { SourceResult } from './wikipedia';

export async function fetchPubMedResults(claim: string): Promise<SourceResult[]> {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=3&term=${encodeURIComponent(claim)}`;
  try {
    const searchResponse = await axios.get(searchUrl);
    const ids = searchResponse.data.esearchresult.idlist;
    if (!ids.length) return [];
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
    const fetchResponse = await axios.get(fetchUrl);
    const articles = Object.values(fetchResponse.data.result).filter((item: any) => item.uid);
    return articles.slice(0, 3).map((article: any) => ({
      title: article.title,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
      excerpt: article.summary || article.title,
      domain: 'pubmed.ncbi.nlm.nih.gov',
      credibilityScore: 95, // Peer-reviewed academic source
    }));
  } catch (error) {
    console.error('PubMed fetch error:', error);
    return [];
  }
}
