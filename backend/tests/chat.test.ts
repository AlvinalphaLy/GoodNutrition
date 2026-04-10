import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkSafety, checkOutputSafety } from "../src/lib/safety";
import { buildSystemPrompt } from "../src/lib/prompt";
import { UserProfile } from "../src/lib/types";

// ── Safety tests ─────────────────────────────────────────────────────────────
describe("checkSafety", () => {
  it("passes normal nutrition questions", () => {
    const result = checkSafety("What should I eat for lunch?");
    expect(result.safe).toBe(true);
  });

  it("blocks medical emergencies", () => {
    const result = checkSafety("I'm having chest pain and can't breathe");
    expect(result.safe).toBe(false);
    if (!result.safe) {
      expect(result.level).toBe("block");
      expect(result.reason).toBe("medical_emergency");
      expect(result.response).toContain("emergency services");
    }
  });

  it("warns on eating disorder signals", () => {
    const result = checkSafety("How do I eat only 300 calories?");
    expect(result.safe).toBe(false);
    if (!result.safe) {
      expect(result.level).toBe("warn");
      expect(result.reason).toBe("eating_disorder_signal");
    }
  });

  it("warns on prescription requests", () => {
    const result = checkSafety("Should I take ozempic to lose weight?");
    expect(result.safe).toBe(false);
    if (!result.safe) {
      expect(result.level).toBe("warn");
      expect(result.reason).toBe("prescription_request");
    }
  });

  it("passes allergy questions", () => {
    const result = checkSafety("I'm allergic to peanuts — what snacks are safe?");
    expect(result.safe).toBe(true);
  });
});

// ── Output safety tests ───────────────────────────────────────────────────────
describe("checkOutputSafety", () => {
  it("returns null for safe output", () => {
    const result = checkOutputSafety("Try adding more vegetables to your plate for extra fibre.");
    expect(result).toBeNull();
  });

  it("flags dangerous calorie advice", () => {
    const result = checkOutputSafety("You should eat only 400 calories per day.");
    expect(result).not.toBeNull();
    expect(result).toContain("safe advice");
  });

  it("flags absolute cure claims", () => {
    const result = checkOutputSafety("This diet is guaranteed to cure your diabetes.");
    expect(result).not.toBeNull();
  });
});

// ── System prompt tests ───────────────────────────────────────────────────────
describe("buildSystemPrompt", () => {
  const baseProfile: UserProfile = {
    userId: "test-user",
    goals: ["fat_loss", "better_energy"],
    allergies: ["peanuts", "shellfish"],
    dietaryPreferences: ["gluten_free"],
    cookingSkill: "intermediate",
    budgetLevel: "medium",
    culturalBackground: "West African",
  };

  it("includes the user goals", () => {
    const prompt = buildSystemPrompt(baseProfile);
    expect(prompt).toContain("fat loss");
    expect(prompt).toContain("better energy");
  });

  it("includes allergy warnings", () => {
    const prompt = buildSystemPrompt(baseProfile);
    expect(prompt).toContain("peanuts");
    expect(prompt).toContain("shellfish");
    expect(prompt).toContain("NEVER suggest");
  });

  it("includes dietary preferences", () => {
    const prompt = buildSystemPrompt(baseProfile);
    expect(prompt).toContain("gluten_free");
  });

  it("includes cultural background", () => {
    const prompt = buildSystemPrompt(baseProfile);
    expect(prompt).toContain("West African");
  });

  it("includes safety guardrails", () => {
    const prompt = buildSystemPrompt(baseProfile);
    expect(prompt).toContain("medical diagnoses");
    expect(prompt).toContain("eating disorder");
  });

  it("handles empty profile gracefully", () => {
    const empty: UserProfile = {
      userId: "u",
      goals: [],
      allergies: [],
      dietaryPreferences: [],
      cookingSkill: "beginner",
      budgetLevel: "low",
    };
    const prompt = buildSystemPrompt(empty);
    expect(prompt).toContain("general healthy eating");
    expect(prompt).toContain("No known food allergies");
  });
});
