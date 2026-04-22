export type ProductResult = {
  code: string;
  status: number;
  status_verbose: string;
  product: {
    product_name: string;
    brands: string | null;
    nova_group: number | null;
    nutriscore_grade: string | null;
    ingredients_text: string | null;
    additives_tags: string[] | null;
    allergens_tags: string[] | null;
    nutrient_levels: {
      fat: "low" | "moderate" | "high" | null;
      "saturated-fat": "low" | "moderate" | "high" | null;
      sugars: "low" | "moderate" | "high" | null;
      salt: "low" | "moderate" | "high" | null;
    } | null;
    ingredients_analysis_tags: string[] | null;
    // image_url: string | null;
    serving_size: string | null;
    nutriments: {
      "energy-kcal_100g": number | null;
      proteins_100g: number | null;
      carbohydrates_100g: number | null;
      fat_100g: number | null;
      "saturated-fat_100g": number | null;
      sugars_100g: number | null;
      fiber_100g: number | null;
      salt_100g: number | null;
      sodium_100g: number | null;
      "energy-kcal_serving": number | null;
      proteins_serving: number | null;
      carbohydrates_serving: number | null;
      fat_serving: number | null;
      sugars_serving: number | null;
      fiber_serving: number | null;
      salt_serving: number | null;
    };
  };
};

type OFFSearchResponse = {
  products: ProductResult["product"][];
  count: number;
};

const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_FIELDS =
  "product_name,nova_group,nutriscore_grade,ingredients_text,additives_tags," +
  "allergens_tags,nutrient_levels,serving_size,nutriments";

// "kitkat" → "kit kat", "cocacola" → "coca cola"
function normalizeSearchTerm(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")           // camelCase split
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")            // letters + digits
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
}

async function fetchOFF(term: string): Promise<ProductResult["product"] | null> {
  const url =
    `${OFF_SEARCH}?search_terms=${encodeURIComponent(term)}` +
    `&search_simple=1&action=process&json=1&page_size=5&fields=${OFF_FIELDS}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}`);

  const data = (await response.json()) as OFFSearchResponse;
  return data.products?.find((p) => p?.nutriments?.["energy-kcal_100g"] != null) ?? null;
}

export async function searchFoodByName(
  name: string
): Promise<ProductResult["product"] | null> {
  const normalized = normalizeSearchTerm(name);
  const terms = normalized === name.toLowerCase().trim()
    ? [normalized]
    : [normalized, name.trim()]; // try normalized first, fall back to original

  for (const term of terms) {
    // retry once on 5xx (server-side transient errors)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const product = await fetchOFF(term);
        if (product) return product;
        break; // got a valid response (0 results) — no point retrying
      } catch (err: unknown) {
        const status = err instanceof Error ? err.message : "";
        const is5xx = /^5\d\d$/.test(status);
        if (is5xx && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        console.warn(`[nutrition] OFF error for "${term}":`, err);
        break;
      }
    }
  }

  console.warn(`[nutrition] no OFF results for "${name}"`);
  return null;
}

export const getData = async (query: string) => {
  const url = `https://world.openfoodfacts.net/api/v2/product/${query}?fields=product_name,brands,nutriscore_grade,nutriscore_score,nova_group,ingredients_text,additives_tags,allergens_tags,nutrient_levels,ingredients_analysis_tags,image_url,serving_size,nutriments.energy-kcal_100g,nutriments.proteins_100g,nutriments.carbohydrates_100g,nutriments.fat_100g,nutriments.saturated-fat_100g,nutriments.sugars_100g,nutriments.fiber_100g,nutriments.salt_100g,nutriments.sodium_100g,nutriments.energy-kcal_serving,nutriments.proteins_serving,nutriments.carbohydrates_serving,nutriments.fat_serving,nutriments.sugars_serving,nutriments.fiber_serving,nutriments.salt_serving,status_verbose`;

  let result;

  try {
    const response = await fetch(url, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    result = (await response.json()) as ProductResult;
  } catch (error) {
    console.log(error);
  }
  return result;
};
