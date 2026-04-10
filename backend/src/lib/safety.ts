/**
 * Pre-LLM safety checks.
 * Run these BEFORE sending the message to the AI to catch obvious flags early
 * and avoid wasting tokens (or worse, reinforcing harmful content).
 */

export type SafetyResult =
  | { safe: true }
  | { safe: false; level: "warn" | "block"; reason: string; response: string };

interface Pattern {
  level: "warn" | "block";
  reason: string;
  response: string;
  patterns: RegExp[];
}

const CHECKS: Pattern[] = [
  {
    level: "block",
    reason: "medical_emergency",
    response:
      "This sounds like it could be a medical emergency. Please call emergency services (911 in the US) or go to the nearest emergency room immediately. I'm a nutrition assistant and I'm not equipped to help with this — please get real help now.",
    patterns: [
      /\b(chest pain|can't breathe|difficulty breathing|unconscious|stroke|heart attack|anaphylaxis|severe allergic)\b/i,
      /\b(overdose|suicidal|self.harm|kill myself)\b/i,
    ],
  },
  {
    level: "warn",
    reason: "eating_disorder_signal",
    response:
      "I want to make sure I support you in a healthy way. Some of what you've described makes me want to check in — have you been able to speak with a doctor or a registered dietitian? They can provide personalised guidance that goes beyond what I can offer. The National Eating Disorders Association (NEDA) helpline (1-800-931-2237) is also a great resource if you ever want to talk to someone.",
    patterns: [
      /\b(purging|laxatives? to lose|binge.{0,20}purge|make myself (sick|vomit))\b/i,
      /\b(eat (nothing|under \d{1,3} calories|only \d{1,3} cal))\b/i,
      /\b(terrified of (eating|food|carbs|fat)|all food (is|makes me))\b/i,
    ],
  },
  {
    level: "warn",
    reason: "prescription_request",
    response:
      "I can't recommend specific medications, supplements in therapeutic doses, or medical treatments — that's outside my scope as a nutrition assistant. For anything involving prescriptions or medical management of a condition, please consult a licensed healthcare provider.",
    patterns: [
      /\b(prescribe|prescription|medication for|drug for|should i take .{0,30}mg)\b/i,
      /\b(ozempic|semaglutide|phentermine|orlistat|mounjaro)\b/i,
    ],
  },
];

/**
 * Returns safe:true if the message passes all checks,
 * or safe:false with the appropriate level, reason, and a pre-written response.
 * "block" means don't send to the LLM at all.
 * "warn" means the LLM can still be consulted but add the context.
 */
export function checkSafety(message: string): SafetyResult {
  for (const check of CHECKS) {
    for (const pattern of check.patterns) {
      if (pattern.test(message)) {
        return {
          safe: false,
          level: check.level,
          reason: check.reason,
          response: check.response,
        };
      }
    }
  }
  return { safe: true };
}

/**
 * Lightweight check on the AI's own output before streaming it.
 * Returns a replacement message if the AI output looks problematic.
 */
export function checkOutputSafety(output: string): string | null {
  const dangerousPatterns = [
    /eat (only |just )?\d{1,3} calories/i,                  // dangerously low cals in output
    /\b(guaranteed to|will definitely cure|proven to cure)\b/i,
  ];
  for (const p of dangerousPatterns) {
    if (p.test(output)) {
      return (
        "I want to make sure I'm giving you safe advice. " +
        "For personalised targets and medical concerns, please consult a registered dietitian or your doctor."
      );
    }
  }
  return null;
}
