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

/**
 * Checks whether free text (proforma notes or an item description — the
 * only two places delivery dates sometimes get typed by hand instead of
 * using the structured date field) mentions a given calendar date.
 *
 * Deliberately narrow: only looks for DD/MM or "D de <mes>" patterns that
 * match the exact target date, since this only needs to answer "is this
 * specific date mentioned", not parse arbitrary dates. Does NOT match the
 * word "mañana" — that only means the target date when the target is
 * actually tomorrow, which this function has no way to know (use
 * textMentionsTomorrow for that case instead).
 */
export function textMentionsDate(text: string, target: Date): boolean {
  if (!text.trim()) return false;
  const normalized = normalize(text);

  const day = target.getUTCDate();
  const month = target.getUTCMonth() + 1;
  const monthName = MESES[target.getUTCMonth()];
  const monthPattern = monthName === "septiembre" ? "se?ptiembre" : monthName;

  const numericPattern = new RegExp(
    `\\b0?${day}[/-]0?${month}(?:[/-]\\d{2,4})?\\b`
  );
  if (numericPattern.test(normalized)) return true;

  const namedPattern = new RegExp(`\\b0?${day}\\s+de\\s+${monthPattern}\\b`);
  if (namedPattern.test(normalized)) return true;

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
