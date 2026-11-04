// Exactly 12 entries, indexed by Date#getUTCMonth() (0 = enero). "setiembre"
// is a common alternate spelling of "septiembre", not its own month, so it
// is handled as a regex alternative below instead of an extra array slot
// (which previously shifted every month after it by one index).
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[rows - 1][cols - 1];
}

function monthWordMatches(word: string, canonical: string): boolean {
  if (word === canonical) return true;
  if (canonical === "septiembre" && word === "setiembre") return true;
  // Allow a couple of typo'd letters ("novimebre" for "noviembre") without
  // being loose enough to confuse two different months with each other.
  const threshold = canonical.length <= 5 ? 1 : 2;
  return levenshtein(word, canonical) <= threshold;
}

/**
 * Checks whether free text (proforma notes or an item description — the
 * only two places delivery dates sometimes get typed by hand instead of
 * using the structured date field) mentions a given calendar date.
 *
 * Deliberately narrow: only looks for the unambiguous "D de <mes>" pattern
 * (e.g. "4 de noviembre"), tolerating small spelling mistakes in the month
 * word via edit distance. A plain numeric DD/MM pattern was tried and
 * dropped — it false-matched unrelated numbers in the text (an item code,
 * a quantity, a weight) that happened to read as e.g. "4-11" with no date
 * intended. Does NOT match the word "mañana" — that only means the target
 * date when the target is actually tomorrow, which this function has no
 * way to know (use textMentionsTomorrow for that case instead).
 */
export function textMentionsDate(text: string, target: Date): boolean {
  if (!text.trim()) return false;
  const normalized = normalize(text);

  const day = target.getUTCDate();
  const monthName = MESES[target.getUTCMonth()];

  const dayWordPattern = /\b0?(\d{1,2})\s+de\s+([a-z]+)\b/g;
  for (const match of normalized.matchAll(dayWordPattern)) {
    const [, matchedDay, matchedWord] = match;
    if (Number(matchedDay) === day && monthWordMatches(matchedWord, monthName)) {
      return true;
    }
  }

  return false;
}

/**
 * Same as textMentionsDate, but also matches the literal word "mañana"
 * (not "pasado mañana"). Only use this when target is actually tomorrow's
 * date (e.g. the "entregas de mañana" notification) — using it for an
 * arbitrary user-picked date would wrongly match any text that says
 * "mañana" regardless of which date was actually meant.
 */
export function textMentionsTomorrow(text: string, target: Date): boolean {
  if (!text.trim()) return false;
  if (textMentionsDate(text, target)) return true;

  const normalized = normalize(text);
  return /(?<!pasado\s)\bmanana\b/.test(normalized);
}
