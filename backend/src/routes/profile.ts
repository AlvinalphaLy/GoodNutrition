/**
 * PATCH /api/sessions/:sessionId/profile
 *
 * Update the user profile stored in the session's SQLite database.
 * Call this when the user updates their goals, allergies, or preferences
 * in the app's settings screen.
 *
 * Request body:
 *   {
 *     "profile": {
 *       "name": "Alex",
 *       "goals": ["fat_loss", "better_energy"],
 *       "allergies": ["peanuts"],
 *       "dietaryPreferences": ["gluten_free"],
 *       "cookingSkill": "intermediate",
 *       "budgetLevel": "medium",
 *       "weeklySchedule": "works late Mon–Wed",
 *       "culturalBackground": "West African"
 *     }
 *   }
 *
 * All fields are optional — only provided fields are updated (merge patch).
 *
 * Response:
 *   200  { "ok": true }
 *   400  { "error": "Invalid JSON body." }
 */
export type ProfileEndpointDocs = never;
