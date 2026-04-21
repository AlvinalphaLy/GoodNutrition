const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
  quarter: 0.25,
};

export function extractQuantity(token: string): number | null {
  const lower = token.toLowerCase().trim();

  if (WORD_NUMBERS[lower] !== undefined) return WORD_NUMBERS[lower];

  const fractionMatch = lower.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return Number(fractionMatch[1]) / Number(fractionMatch[2]);
  }

  const num = parseFloat(lower);
  return isNaN(num) ? null : num;
}
