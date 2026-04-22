export type OpenFoodFactsNutriments = {
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

export type OpenFoodFactsProduct = {
  code: string;
  product_name: string;
  brands: string | null;
  nova_group?: number | null;
  nutriscore_grade?: string | null;
  ingredients_text: string | null;
  additives_tags?: string[] | null;
  allergens_tags?: string[] | null;
  nutrient_levels?: {
    fat: "low" | "moderate" | "high" | null;
    "saturated-fat": "low" | "moderate" | "high" | null;
    sugars: "low" | "moderate" | "high" | null;
    salt: "low" | "moderate" | "high" | null;
  } | null;
  ingredients_analysis_tags?: string[] | null;
  serving_size: string | null;
  nutriments: OpenFoodFactsNutriments;
};

export type ProductResult = {
  code: string;
  status: number;
  status_verbose: string;
  product: OpenFoodFactsProduct;
};

export type OpenFoodFactsSearchProduct = OpenFoodFactsProduct;

type SearchResponse = {
  count?: number;
  page?: number;
  page_count?: number;
  page_size?: number;
  products?: OpenFoodFactsSearchProduct[];
};

const PRODUCT_FIELDS = [
  "product_name",
  "brands",
  "nutriscore_grade",
  "nutriscore_score",
  "nova_group",
  "ingredients_text",
  "additives_tags",
  "allergens_tags",
  "nutrient_levels",
  "ingredients_analysis_tags",
  "image_url",
  "serving_size",
  "nutriments.energy-kcal_100g",
  "nutriments.proteins_100g",
  "nutriments.carbohydrates_100g",
  "nutriments.fat_100g",
  "nutriments.saturated-fat_100g",
  "nutriments.sugars_100g",
  "nutriments.fiber_100g",
  "nutriments.salt_100g",
  "nutriments.sodium_100g",
  "nutriments.energy-kcal_serving",
  "nutriments.proteins_serving",
  "nutriments.carbohydrates_serving",
  "nutriments.fat_serving",
  "nutriments.sugars_serving",
  "nutriments.fiber_serving",
  "nutriments.salt_serving",
  "status_verbose",
].join(",");

const SEARCH_FIELDS = [
  "code",
  "product_name",
  "brands",
  "serving_size",
  "ingredients_text",
  "nutriments.energy-kcal_100g",
  "nutriments.proteins_100g",
  "nutriments.carbohydrates_100g",
  "nutriments.fat_100g",
  "nutriments.energy-kcal_serving",
  "nutriments.proteins_serving",
  "nutriments.carbohydrates_serving",
  "nutriments.fat_serving",
].join(",");

const SEARCH_LIMIT_PER_MINUTE = 8;
const SEARCH_WINDOW_MS = 60_000;
const searchCache = new Map<string, OpenFoodFactsSearchProduct[]>();
const productCache = new Map<string, ProductResult>();
const searchRequestTimestamps: number[] = [];

const pruneSearchTimestamps = () => {
  const cutoff = Date.now() - SEARCH_WINDOW_MS;
  while (searchRequestTimestamps.length > 0 && searchRequestTimestamps[0] < cutoff) {
    searchRequestTimestamps.shift();
  }
};

const normalizeSearchQuery = (query: string) => query.trim().toLowerCase().replace(/\s+/g, " ");

const coerceNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeNutriments = (raw: Record<string, unknown> | undefined): OpenFoodFactsNutriments => ({
  "energy-kcal_100g": coerceNumber(raw?.["energy-kcal_100g"]),
  proteins_100g: coerceNumber(raw?.proteins_100g),
  carbohydrates_100g: coerceNumber(raw?.carbohydrates_100g),
  fat_100g: coerceNumber(raw?.fat_100g),
  "saturated-fat_100g": coerceNumber(raw?.["saturated-fat_100g"]),
  sugars_100g: coerceNumber(raw?.sugars_100g),
  fiber_100g: coerceNumber(raw?.fiber_100g),
  salt_100g: coerceNumber(raw?.salt_100g),
  sodium_100g: coerceNumber(raw?.sodium_100g),
  "energy-kcal_serving": coerceNumber(raw?.["energy-kcal_serving"]),
  proteins_serving: coerceNumber(raw?.proteins_serving),
  carbohydrates_serving: coerceNumber(raw?.carbohydrates_serving),
  fat_serving: coerceNumber(raw?.fat_serving),
  sugars_serving: coerceNumber(raw?.sugars_serving),
  fiber_serving: coerceNumber(raw?.fiber_serving),
  salt_serving: coerceNumber(raw?.salt_serving),
});

const normalizeProduct = (raw: Record<string, unknown> | null | undefined): OpenFoodFactsProduct | null => {
  if (!raw) return null;

  const code = String(raw.code ?? "").trim();
  const productName = String(raw.product_name ?? "").trim();
  if (!code || !productName) return null;

  return {
    code,
    product_name: productName,
    brands: typeof raw.brands === "string" ? raw.brands : null,
    nova_group: coerceNumber(raw.nova_group),
    nutriscore_grade: typeof raw.nutriscore_grade === "string" ? raw.nutriscore_grade : null,
    ingredients_text: typeof raw.ingredients_text === "string" ? raw.ingredients_text : null,
    additives_tags: Array.isArray(raw.additives_tags) ? raw.additives_tags.filter((value): value is string => typeof value === "string") : null,
    allergens_tags: Array.isArray(raw.allergens_tags) ? raw.allergens_tags.filter((value): value is string => typeof value === "string") : null,
    nutrient_levels: raw.nutrient_levels && typeof raw.nutrient_levels === "object" ? raw.nutrient_levels as OpenFoodFactsProduct["nutrient_levels"] : null,
    ingredients_analysis_tags: Array.isArray(raw.ingredients_analysis_tags) ? raw.ingredients_analysis_tags.filter((value): value is string => typeof value === "string") : null,
    serving_size: typeof raw.serving_size === "string" ? raw.serving_size : null,
    nutriments: normalizeNutriments(raw.nutriments as Record<string, unknown> | undefined),
  };
};

export const getOpenFoodFactsSearchWaitMs = () => {
  pruneSearchTimestamps();
  if (searchRequestTimestamps.length < SEARCH_LIMIT_PER_MINUTE) {
    return 0;
  }

  return Math.max(0, SEARCH_WINDOW_MS - (Date.now() - searchRequestTimestamps[0]));
};

export const searchOpenFoodFacts = async (query: string, pageSize = 8) => {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const cached = searchCache.get(normalizedQuery);
  if (cached) {
    return cached;
  }

  const waitMs = getOpenFoodFactsSearchWaitMs();
  if (waitMs > 0) {
    throw new Error(`RATE_LIMIT:${waitMs}`);
  }

  searchRequestTimestamps.push(Date.now());
  const url = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${encodeURIComponent(SEARCH_FIELDS)}`;

  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Open Food Facts search failed: ${response.status}`);
  }

  const json = await response.json() as SearchResponse;
  const products = (json.products ?? [])
    .map((product) => normalizeProduct(product as unknown as Record<string, unknown>))
    .filter((product): product is OpenFoodFactsSearchProduct => !!product);

  searchCache.set(normalizedQuery, products);
  return products;
};

export const getData = async (barcode: string) => {
  const trimmedBarcode = barcode.trim();
  if (!trimmedBarcode) return undefined;

  const cached = productCache.get(trimmedBarcode);
  if (cached) {
    return cached;
  }

  const url = `https://world.openfoodfacts.net/api/v2/product/${trimmedBarcode}?fields=${PRODUCT_FIELDS}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Open Food Facts product lookup failed: ${response.status}`);
  }

  const json = await response.json() as ProductResult;
  const normalizedProduct = normalizeProduct(json.product as unknown as Record<string, unknown>);
  if (!normalizedProduct) {
    return json;
  }

  const result: ProductResult = {
    ...json,
    code: trimmedBarcode,
    product: normalizedProduct,
  };
  productCache.set(trimmedBarcode, result);
  return result;
};
