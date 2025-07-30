import { googleSearch, newsApiSearch, academicApiSearch } from './thirdparty';

export async function checkFactSources(claim: string) {
  const [google, news, academic] = await Promise.all([
    googleSearch(claim),
    newsApiSearch(claim),
    academicApiSearch(claim)
  ]);
  // Deduplicate, rank, and return top 3
  const all = [...google, ...news, ...academic];
  // ...deduplication and scoring logic here...
  return all.slice(0, 3);
}