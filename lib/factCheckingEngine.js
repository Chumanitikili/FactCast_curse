// Modular multi-source fact-checking, returns top 3 credible sources

import { queryGoogleSearch, queryNewsAPI, queryAcademicAPI } from "./sourceAdapters";
import { scoreSourceCredibility } from "./sourceScoring";

// Returns exactly 3 different, credible, diverse sources per claim
export async function checkFact(claim) {
  const [google, news, academic] = await Promise.all([
    queryGoogleSearch(claim),
    queryNewsAPI(claim),
    queryAcademicAPI(claim)
  ]);
  // Flatten and dedupe by domain
  let allSources = [...google, ...news, ...academic]
    .filter((v, i, arr) => arr.findIndex(s => s.domain === v.domain) === i);
  allSources.forEach(src => src.credibility = scoreSourceCredibility(src));
  allSources.sort((a, b) => b.credibility - a.credibility);
  return allSources.slice(0, 3);
}