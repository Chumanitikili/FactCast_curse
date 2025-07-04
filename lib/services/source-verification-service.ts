import { OpenAI } from "openai";
import { Configuration } from "@supabase/supabase-js";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-build",
});

interface Source {
  title: string;
  url: string;
  content: string;
  credibilityScore: number;
  sourceType: "news" | "academic" | "government" | "other";
}

export class SourceVerificationService {
  private static instance: SourceVerificationService;
  private constructor() {}

  public static getInstance(): SourceVerificationService {
    if (!SourceVerificationService.instance) {
      SourceVerificationService.instance = new SourceVerificationService();
    }
    return SourceVerificationService.instance;
  }

  async getMultipleSources(claim: string): Promise<Source[]> {
    // Get sources from multiple APIs
    const [googleSources, academicSources, governmentSources] = await Promise.all([
      this.getGoogleSources(claim),
      this.getAcademicSources(claim),
      this.getGovernmentSources(claim),
    ]);

    // Combine and rank sources
    const allSources = [...googleSources, ...academicSources, ...governmentSources];
    const rankedSources = this.rankSources(allSources);

    // Ensure we have exactly 3 sources
    return rankedSources.slice(0, 3);
  }

  private async getGoogleSources(claim: string): Promise<Source[]> {
    try {
      const response = await axios.get(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(claim)}`,
        {
          headers: {
            "X-Api-Key": process.env.NEWS_API_KEY,
          },
        }
      );
      
      return response.data.articles.map((article: any) => ({
        title: article.title,
        url: article.url,
        content: article.description,
        credibilityScore: this.calculateCredibilityScore(article.source.name),
        sourceType: "news",
      }));
    } catch (error) {
      console.error("Error fetching Google sources:", error);
      return [];
    }
  }

  private async getAcademicSources(claim: string): Promise<Source[]> {
    try {
      const response = await axios.get(
        `https://api.crossref.org/works?query=${encodeURIComponent(claim)}`
      );
      
      return response.data.message.items.map((item: any) => ({
        title: item.title[0],
        url: item.DOI ? `https://doi.org/${item.DOI}` : "",
        content: item.abstract || "",
        credibilityScore: 0.9,
        sourceType: "academic",
      }));
    } catch (error) {
      console.error("Error fetching academic sources:", error);
      return [];
    }
  }

  private async getGovernmentSources(claim: string): Promise<Source[]> {
    try {
      const response = await axios.get(
        `https://api.data.gov/search?query=${encodeURIComponent(claim)}`,
        {
          headers: {
            "X-Api-Key": process.env.GOVERNMENT_API_KEY,
          },
        }
      );
      
      return response.data.results.map((item: any) => ({
        title: item.title,
        url: item.link,
        content: item.description,
        credibilityScore: 0.95,
        sourceType: "government",
      }));
    } catch (error) {
      console.error("Error fetching government sources:", error);
      return [];
    }
  }

  private calculateCredibilityScore(sourceName: string): number {
    const reliableSources = [
      "Reuters",
      "AP News",
      "BBC News",
      "The New York Times",
      "The Washington Post",
      "CNN",
      "NPR",
      "The Guardian",
      "Financial Times",
      "The Economist",
    ];

    return reliableSources.includes(sourceName) ? 0.85 : 0.7;
  }

  private rankSources(sources: Source[]): Source[] {
    return sources.sort((a, b) => b.credibilityScore - a.credibilityScore);
  }
}

// Source credibility scoring for MVP
// In production, use advanced credibility scoring

export function scoreSource(url: string, type: string): number {
  switch (type) {
    case "government":
      return 0.95;
    case "academic":
      return 0.9;
    case "news":
      return 0.8;
    default:
      return 0.7;
  }
}

// TODO: Implement advanced credibility scoring for production
