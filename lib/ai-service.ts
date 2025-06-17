import type { FactCheckResult } from "./types"

// Mock AI service for fact-checking
export class AIFactCheckService {
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    // Simulate transcription delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock transcription result
    return `This is a sample transcription of the podcast audio. The speaker mentioned that the Great Wall of China is visible from space, which is actually a common misconception. They also discussed climate change statistics and mentioned that renewable energy accounts for 30% of global electricity generation.`
  }

  static async extractClaims(transcript: string): Promise<string[]> {
    // Simulate claim extraction
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return [
      "The Great Wall of China is visible from space",
      "Renewable energy accounts for 30% of global electricity generation",
      "Climate change is causing sea levels to rise by 3mm per year",
    ]
  }

  static async factCheckClaim(claim: string, timestamp: number): Promise<Omit<FactCheckResult, "id" | "podcastId">> {
    // Simulate fact-checking delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock fact-checking results based on claim content
    if (claim.includes("Great Wall") && claim.includes("space")) {
      return {
        timestamp,
        claim,
        verdict: "false",
        confidence: 95,
        sources: [
          {
            id: "1",
            title: "NASA: Great Wall of China Not Visible from Space",
            url: "https://www.nasa.gov/vision/space/workinginspace/great_wall.html",
            domain: "nasa.gov",
            reliability: 95,
          },
        ],
        explanation:
          "The Great Wall of China is not visible from space without aid. This is a persistent myth that has been debunked by astronauts and space agencies.",
      }
    } else if (claim.includes("renewable energy") && claim.includes("30%")) {
      return {
        timestamp,
        claim,
        verdict: "true",
        confidence: 88,
        sources: [
          {
            id: "2",
            title: "IEA Global Energy Review 2024",
            url: "https://www.iea.org/reports/global-energy-review-2024",
            domain: "iea.org",
            reliability: 92,
          },
        ],
        explanation:
          "According to the International Energy Agency, renewable energy sources accounted for approximately 30% of global electricity generation in 2023.",
      }
    } else {
      return {
        timestamp,
        claim,
        verdict: "unverified",
        confidence: 65,
        sources: [],
        explanation: "This claim requires additional verification from authoritative sources.",
      }
    }
  }
}
