import type { VerificationSource, Perspective, LiveFactCheck } from "./realtime-types"

interface SessionSettings {
  sourceTypes: string[]
  maxSourcesPerCheck: number
  confidenceThreshold: number
}

export class MultiSourceFactChecker {
  private readonly sourceAPIs = {
    news: [
      { name: "NewsAPI", endpoint: "https://newsapi.org/v2/everything", key: process.env.NEWS_API_KEY },
      { name: "Guardian", endpoint: "https://content.guardianapis.com/search", key: process.env.GUARDIAN_API_KEY },
    ],
    academic: [
      { name: "Semantic Scholar", endpoint: "https://api.semanticscholar.org/graph/v1/paper/search" },
      { name: "CrossRef", endpoint: "https://api.crossref.org/works" },
    ],
    government: [{ name: "Data.gov", endpoint: "https://catalog.data.gov/api/3/action/package_search" }],
  }

  async verifyFactClaim(claim: string, settings: SessionSettings): Promise<LiveFactCheck> {
    const factCheck: Partial<LiveFactCheck> = {
      id: this.generateId(),
      claim,
      timestamp: Date.now(),
      status: "processing",
      sources: [],
      perspectives: [],
      flagged: false,
    }

    try {
      // Step 1: Extract key entities and concepts
      const entities = await this.extractEntities(claim)

      // Step 2: Search multiple source types
      const sources = await this.searchMultipleSources(claim, entities, settings)

      // Step 3: Ensure source diversity
      const diverseSources = this.ensureSourceDiversity(sources, settings.maxSourcesPerCheck)

      // Step 4: Generate perspectives
      const perspectives = await this.generatePerspectives(claim, diverseSources)

      // Step 5: Calculate confidence and verdict
      const { confidence, verdict } = this.calculateVerdict(perspectives)

      // Step 6: Generate AI summary
      const aiSummary = await this.generateAISummary(claim, perspectives)

      return {
        ...factCheck,
        status: "completed",
        confidence,
        verdict,
        sources: diverseSources,
        perspectives,
        aiSummary,
        flagged: confidence < settings.confidenceThreshold,
      } as LiveFactCheck
    } catch (error) {
      console.error("Fact-checking failed:", error)
      return {
        ...factCheck,
        status: "failed",
        confidence: 0,
        verdict: "unverified",
        flagged: true,
      } as LiveFactCheck
    }
  }

  private async extractEntities(claim: string): Promise<string[]> {
    // Simple entity extraction - in production, use NLP services
    const entities: string[] = []

    // Extract numbers, dates, names, places
    const patterns = [
      /\b\d{4}\b/g, // years
      /\b\d+%\b/g, // percentages
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // proper names
      /\$[\d,]+/g, // monetary amounts
    ]

    patterns.forEach((pattern) => {
      const matches = claim.match(pattern)
      if (matches) entities.push(...matches)
    })

    return entities
  }

  private async searchMultipleSources(
    claim: string,
    entities: string[],
    settings: SessionSettings,
  ): Promise<VerificationSource[]> {
    const allSources: VerificationSource[] = []
    const searchQuery = this.buildSearchQuery(claim, entities)

    // Search news sources
    if (settings.sourceTypes.includes("news")) {
      const newsSources = await this.searchNewsSources(searchQuery)
      allSources.push(...newsSources)
    }

    // Search academic sources
    if (settings.sourceTypes.includes("academic")) {
      const academicSources = await this.searchAcademicSources(searchQuery)
      allSources.push(...academicSources)
    }

    // Search government sources
    if (settings.sourceTypes.includes("government")) {
      const govSources = await this.searchGovernmentSources(searchQuery)
      allSources.push(...govSources)
    }

    return allSources
  }

  private async searchNewsSources(query: string): Promise<VerificationSource[]> {
    const sources: VerificationSource[] = []

    try {
      // Mock news API call - replace with actual API calls
      const mockResults = [
        {
          title: "Climate Change Report Shows Rising Temperatures",
          url: "https://example-news.com/climate-report",
          domain: "example-news.com",
          publishDate: "2024-01-15",
          excerpt: "New data confirms global temperature increases...",
          politicalLean: "center" as const,
          reliability: 85,
        },
        {
          title: "Economic Analysis: Renewable Energy Growth",
          url: "https://business-times.com/renewable-growth",
          domain: "business-times.com",
          publishDate: "2024-01-10",
          excerpt: "Renewable energy sector shows 30% growth...",
          politicalLean: "right" as const,
          reliability: 78,
        },
      ]

      sources.push(
        ...mockResults.map((result) => ({
          id: this.generateId(),
          title: result.title,
          url: result.url,
          domain: result.domain,
          publishDate: result.publishDate,
          reliability: result.reliability,
          politicalLean: result.politicalLean,
          sourceType: "news" as const,
          excerpt: result.excerpt,
        })),
      )
    } catch (error) {
      console.error("News search failed:", error)
    }

    return sources
  }

  private async searchAcademicSources(query: string): Promise<VerificationSource[]> {
    // Mock academic search - replace with actual API calls
    return [
      {
        id: this.generateId(),
        title: "Peer-reviewed Study on Climate Data",
        url: "https://academic-journal.com/climate-study",
        domain: "academic-journal.com",
        publishDate: "2023-12-01",
        reliability: 95,
        politicalLean: "unknown" as const,
        sourceType: "academic" as const,
        excerpt: "Comprehensive analysis of temperature data...",
      },
    ]
  }

  private async searchGovernmentSources(query: string): Promise<VerificationSource[]> {
    // Mock government search - replace with actual API calls
    return [
      {
        id: this.generateId(),
        title: "EPA Climate Data Report",
        url: "https://epa.gov/climate-data-2024",
        domain: "epa.gov",
        publishDate: "2024-01-01",
        reliability: 92,
        politicalLean: "center" as const,
        sourceType: "government" as const,
        excerpt: "Official government climate statistics...",
      },
    ]
  }

  private ensureSourceDiversity(sources: VerificationSource[], maxSources: number): VerificationSource[] {
    // Ensure political balance and source type diversity
    const diverse: VerificationSource[] = []
    const byLean = { left: [], center: [], right: [], unknown: [] }
    const byType = { news: [], academic: [], government: [], blog: [], social: [], other: [] }

    // Group sources
    sources.forEach((source) => {
      byLean[source.politicalLean].push(source)
      byType[source.sourceType].push(source)
    })

    // Select diverse sources
    const targetPerLean = Math.floor(maxSources / 3)

    // Try to get balanced political representation
    Object.values(byLean).forEach((leanSources) => {
      const selected = leanSources.sort((a, b) => b.reliability - a.reliability).slice(0, targetPerLean)
      diverse.push(...selected)
    })

    // Fill remaining slots with highest reliability
    const remaining = maxSources - diverse.length
    if (remaining > 0) {
      const unused = sources.filter((s) => !diverse.includes(s))
      const topReliability = unused.sort((a, b) => b.reliability - a.reliability).slice(0, remaining)
      diverse.push(...topReliability)
    }

    return diverse.slice(0, maxSources)
  }

  private async generatePerspectives(claim: string, sources: VerificationSource[]): Promise<Perspective[]> {
    const perspectives: Perspective[] = []

    for (const source of sources) {
      // Analyze how each source relates to the claim
      const perspective: Perspective = {
        id: this.generateId(),
        sourceId: source.id,
        stance: this.determineStance(claim, source.excerpt),
        explanation: this.generateExplanation(claim, source),
        relevanceScore: this.calculateRelevance(claim, source.excerpt),
      }

      perspectives.push(perspective)
    }

    return perspectives.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private determineStance(claim: string, excerpt: string): "supports" | "disputes" | "neutral" {
    // Simple stance detection - in production, use NLP models
    const supportWords = ["confirms", "shows", "proves", "demonstrates", "validates"]
    const disputeWords = ["contradicts", "disputes", "refutes", "challenges", "questions"]

    const lowerExcerpt = excerpt.toLowerCase()

    if (supportWords.some((word) => lowerExcerpt.includes(word))) {
      return "supports"
    } else if (disputeWords.some((word) => lowerExcerpt.includes(word))) {
      return "disputes"
    }

    return "neutral"
  }

  private generateExplanation(claim: string, source: VerificationSource): string {
    return `According to ${source.domain}, ${source.excerpt.substring(0, 200)}...`
  }

  private calculateRelevance(claim: string, excerpt: string): number {
    // Simple relevance scoring based on keyword overlap
    const claimWords = claim.toLowerCase().split(/\s+/)
    const excerptWords = excerpt.toLowerCase().split(/\s+/)

    const overlap = claimWords.filter((word) => excerptWords.includes(word)).length
    return (overlap / claimWords.length) * 100
  }

  private calculateVerdict(perspectives: Perspective[]): {
    confidence: number
    verdict: "verified" | "disputed" | "unverified" | "mixed"
  } {
    if (perspectives.length === 0) {
      return { confidence: 0, verdict: "unverified" }
    }

    const supports = perspectives.filter((p) => p.stance === "supports").length
    const disputes = perspectives.filter((p) => p.stance === "disputes").length
    const neutral = perspectives.filter((p) => p.stance === "neutral").length

    const total = perspectives.length
    const avgReliability =
      perspectives.reduce((sum, p) => {
        const source = perspectives.find((ps) => ps.id === p.id)
        return sum + (source ? 80 : 0) // Mock reliability
      }, 0) / total

    let verdict: "verified" | "disputed" | "unverified" | "mixed"
    let confidence: number

    if (supports > disputes && supports > neutral) {
      verdict = "verified"
      confidence = Math.min(95, (supports / total) * 100 * (avgReliability / 100))
    } else if (disputes > supports && disputes > neutral) {
      verdict = "disputed"
      confidence = Math.min(95, (disputes / total) * 100 * (avgReliability / 100))
    } else if (supports > 0 && disputes > 0) {
      verdict = "mixed"
      confidence = Math.min(80, avgReliability)
    } else {
      verdict = "unverified"
      confidence = Math.max(20, avgReliability / 2)
    }

    return { confidence: Math.round(confidence), verdict }
  }

  private async generateAISummary(claim: string, perspectives: Perspective[]): Promise<string> {
    // Mock AI summary generation - replace with actual LLM API call
    const supportingCount = perspectives.filter((p) => p.stance === "supports").length
    const disputingCount = perspectives.filter((p) => p.stance === "disputes").length

    if (supportingCount > disputingCount) {
      return `Based on ${perspectives.length} sources, this claim appears to be supported by available evidence. ${supportingCount} sources provide supporting information, while ${disputingCount} sources dispute it.`
    } else if (disputingCount > supportingCount) {
      return `Based on ${perspectives.length} sources, this claim appears to be disputed by available evidence. ${disputingCount} sources contradict it, while ${supportingCount} sources support it.`
    } else {
      return `Based on ${perspectives.length} sources, this claim has mixed evidence. The available sources present conflicting information that requires further investigation.`
    }
  }

  private buildSearchQuery(claim: string, entities: string[]): string {
    // Combine claim with extracted entities for better search
    return `${claim} ${entities.join(" ")}`
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}
