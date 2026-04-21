const STOP_WORDS = new Set([
  "some", "the", "a", "an", "of", "with", "and", "or", "my", "me",
]);

const ALIASES: Record<string, string> = {
  eggs: "egg",
  toasts: "toast",
  coffees: "coffee",
  bananas: "banana",
  apples: "apple",
  oranges: "orange",
  sandwiches: "sandwich",
  cookies: "cookie",
  berries: "berry",
  grapes: "grape",
  oats: "oat",
};

export function normalizeFoodName(name: string): string {
  const lower = name.toLowerCase().trim();
  return ALIASES[lower] ?? lower;
}

export function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase().trim());
}
