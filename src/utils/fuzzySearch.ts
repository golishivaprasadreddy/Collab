/**
 * Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Normalize a string: lowercase, trim, collapse spaces
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#.]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Check if query fuzzy-matches target.
 * Supports: case insensitive, extra/missing spaces, typos (edit distance ≤ 2)
 */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = normalize(query);
  const t = normalize(target);

  if (!q) return true;
  
  // Exact substring match (case-insensitive, normalized)
  if (t.includes(q) || q.includes(t)) return true;

  // Check without spaces
  const qNoSpace = q.replace(/\s/g, "");
  const tNoSpace = t.replace(/\s/g, "");
  if (tNoSpace.includes(qNoSpace) || qNoSpace.includes(tNoSpace)) return true;

  // Levenshtein distance for typo tolerance
  const maxDist = q.length <= 3 ? 1 : 2;
  if (levenshtein(q, t) <= maxDist) return true;

  // Check each word of query against target words
  const qWords = q.split(" ");
  const tWords = t.split(" ");
  
  return qWords.every(qw =>
    tWords.some(tw => 
      tw.includes(qw) || qw.includes(tw) || levenshtein(qw, tw) <= (qw.length <= 3 ? 1 : 2)
    )
  );
}

/**
 * Compute match score (lower = better). Returns Infinity for no match.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (!q) return 0;
  if (t === q) return 0;
  if (t.startsWith(q)) return 1;
  if (t.includes(q)) return 2;
  const qNoSpace = q.replace(/\s/g, "");
  const tNoSpace = t.replace(/\s/g, "");
  if (tNoSpace.includes(qNoSpace)) return 3;
  const dist = levenshtein(q, t);
  const maxDist = q.length <= 3 ? 1 : 2;
  if (dist <= maxDist) return 4 + dist;
  return Infinity;
}
