import { NextResponse } from "next/server";
import { detectClaims } from "@/lib/engines/claim-detector";
import { checkClaimMultiSource } from "@/lib/engines/multi-source-checker";
import { summarizeClaimResult } from "@/lib/engines/ai-summarizer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.content || body.claim || "";
    if (!input) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }
    // Detect claims
    const claims = detectClaims(input);
    if (!claims.length) {
      return NextResponse.json({ claims: [], message: "No factual claims detected." });
    }
    // For each claim, check sources and summarize
    const results = await Promise.all(
      claims.map(async (claim) => {
        const { sources } = await checkClaimMultiSource(claim);
        const { summary, confidence } = await summarizeClaimResult(claim, sources);
        return {
          claim,
          summary,
          confidence,
          sources,
        };
      })
    );
    return NextResponse.json({ claims: results });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
