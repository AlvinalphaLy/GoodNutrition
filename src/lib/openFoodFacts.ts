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

export type OpenFoodFactsSearchPage = {
  products: OpenFoodFactsSearchProduct[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  hasMore: boolean;
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
  "nutriscore_grade",
  "nova_group",
  "serving_size",
  "ingredients_text",
  "additives_tags",
  "allergens_tags",
  "nutrient_levels",
  "ingredients_analysis_tags",
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
].join(",");

const SEARCH_LIMIT_PER_MINUTE = 8;
const SEARCH_WINDOW_MS = 60_000;
const OFF_BASE_URL = 'https://world.openfoodfacts.net';
const searchCache = new Map<string, OpenFoodFactsSearchPage>();
const searchBatchCache = new Map<string, { products: OpenFoodFactsSearchProduct[]; totalCount: number }>();
const productCache = new Map<string, ProductResult>();
const searchRequestTimestamps: number[] = [];

const pruneSearchTimestamps = () => {
  const cutoff = Date.now() - SEARCH_WINDOW_MS;
  while (searchRequestTimestamps.length > 0 && searchRequestTimestamps[0] < cutoff) {
    searchRequestTimestamps.shift();
  }
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const normalizeSearchQuery = (query: string) =>
  decodeHtmlEntities(query)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
const buildSearchCacheKey = (query: string, page: number, pageSize: number) => `${normalizeSearchQuery(query)}::${page}::${pageSize}`;
const buildSearchBatchCacheKey = (query: string, batchPage: number, batchSize: number) => `${normalizeSearchQuery(query)}::batch::${batchPage}::${batchSize}`;

const getNormalizedTokens = (value: string) => normalizeSearchQuery(value).split(' ').filter(Boolean);

const getSearchScore = (product: OpenFoodFactsSearchProduct, normalizedQuery: string) => {
  const name = normalizeSearchQuery(product.product_name);
  const brand = normalizeSearchQuery(product.brands ?? '');
  const searchable = `${name} ${brand}`.trim();
  const queryTokens = getNormalizedTokens(normalizedQuery);
  const nameTokens = getNormalizedTokens(name);
  const brandTokens = getNormalizedTokens(brand);
  const exactWordPattern = new RegExp(`(?:^|\\s)${normalizedQuery}(?:\\s|$)`);

  let score = 0;

  if (name === normalizedQuery) score += 250_000;
  if (brand === normalizedQuery) score += 20_000;

  if (exactWordPattern.test(name)) score += 70_000;
  if (exactWordPattern.test(brand)) score += 4_000;

  if (name.startsWith(`${normalizedQuery} `) || name.startsWith(normalizedQuery)) score += 45_000;
  if (brand.startsWith(`${normalizedQuery} `) || brand.startsWith(normalizedQuery)) score += 3_500;

  if (nameTokens.includes(normalizedQuery)) score += 30_000;
  if (brandTokens.includes(normalizedQuery)) score += 1_500;

  if (name.includes(normalizedQuery)) score += 12_000;
  if (brand.includes(normalizedQuery)) score += 400;

  const exactNameTokenMatches = queryTokens.filter((token) => nameTokens.includes(token)).length;
  const exactBrandTokenMatches = queryTokens.filter((token) => brandTokens.includes(token)).length;
  const matchedTokens = queryTokens.filter((token) => searchable.includes(token));
  const missingTokens = queryTokens.length - matchedTokens.length;

  score += exactNameTokenMatches * 8_000;
  score += exactBrandTokenMatches * 600;
  score += matchedTokens.length * 750;
  score -= missingTokens * 18_000;

  if (queryTokens.length > 0 && exactNameTokenMatches === queryTokens.length) {
    score += 20_000;
  }

  if (!name.includes(normalizedQuery)) {
    score -= 14_000;
  }

  if (!searchable.includes(normalizedQuery) && missingTokens > 0) {
    score -= 25_000;
  }

  score -= Math.max(0, name.length - normalizedQuery.length) * 2.5;

  return score;
};

const sortProductsForQuery = (products: OpenFoodFactsSearchProduct[], query: string) => {
  const normalizedQuery = normalizeSearchQuery(query);
  return [...products].sort((a, b) => {
    const scoreDiff = getSearchScore(b, normalizedQuery) - getSearchScore(a, normalizedQuery);
    if (scoreDiff !== 0) return scoreDiff;

    const caloriesA = a.nutriments['energy-kcal_serving'] ?? a.nutriments['energy-kcal_100g'] ?? -1;
    const caloriesB = b.nutriments['energy-kcal_serving'] ?? b.nutriments['energy-kcal_100g'] ?? -1;
    if (caloriesA !== caloriesB) return caloriesB - caloriesA;

    return a.product_name.localeCompare(b.product_name);
  });
};

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

const normalizeProduct = (raw: Record<string, unknown> | null | undefined, fallbackCode?: string): OpenFoodFactsProduct | null => {
  if (!raw) return null;

  const code = String(raw.code ?? fallbackCode ?? "").trim();
  const productName = decodeHtmlEntities(String(raw.product_name ?? "").trim());
  if (!code || !productName) return null;

  return {
    code,
    product_name: productName,
    brands: typeof raw.brands === "string" ? decodeHtmlEntities(raw.brands) : null,
    nova_group: coerceNumber(raw.nova_group),
    nutriscore_grade: typeof raw.nutriscore_grade === "string" ? raw.nutriscore_grade : null,
    ingredients_text: typeof raw.ingredients_text === "string" ? decodeHtmlEntities(raw.ingredients_text) : null,
    additives_tags: Array.isArray(raw.additives_tags) ? raw.additives_tags.filter((value): value is string => typeof value === "string") : null,
    allergens_tags: Array.isArray(raw.allergens_tags) ? raw.allergens_tags.filter((value): value is string => typeof value === "string") : null,
    nutrient_levels: raw.nutrient_levels && typeof raw.nutrient_levels === "object" ? raw.nutrient_levels as OpenFoodFactsProduct["nutrient_levels"] : null,
    ingredients_analysis_tags: Array.isArray(raw.ingredients_analysis_tags) ? raw.ingredients_analysis_tags.filter((value): value is string => typeof value === "string") : null,
    serving_size: typeof raw.serving_size === "string" ? decodeHtmlEntities(raw.serving_size) : null,
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

export const searchOpenFoodFactsPage = async (
  query: string,
  page = 1,
  pageSize = 8
): Promise<OpenFoodFactsSearchPage> => {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) {
    return {
      products: [],
      page,
      pageSize,
      pageCount: 0,
      totalCount: 0,
      hasMore: false,
    };
  }

  const cacheKey = buildSearchCacheKey(query, page, pageSize);
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const batchSize = Math.max(pageSize * 4, 24);
  const offset = (page - 1) * pageSize;
  const batchPage = Math.floor(offset / batchSize) + 1;
  const batchOffset = offset % batchSize;
  const batchCacheKey = buildSearchBatchCacheKey(query, batchPage, batchSize);

  let batch = searchBatchCache.get(batchCacheKey);
  if (!batch) {
    const waitMs = getOpenFoodFactsSearchWaitMs();
    if (waitMs > 0) {
      throw new Error(`RATE_LIMIT:${waitMs}`);
    }

    searchRequestTimestamps.push(Date.now());
    const url = `${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page=${batchPage}&page_size=${batchSize}&fields=${encodeURIComponent(SEARCH_FIELDS)}`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Open Food Facts search failed: ${response.status}`);
    }

    const json = (await response.json()) as SearchResponse;
    batch = {
      products: sortProductsForQuery(
        (json.products ?? [])
          .map((product) => normalizeProduct(product as unknown as Record<string, unknown>))
          .filter((product): product is OpenFoodFactsSearchProduct => !!product),
        normalizedQuery
      ),
      totalCount: Number.isFinite(Number(json.count)) ? Number(json.count) : 0,
    };
    searchBatchCache.set(batchCacheKey, batch);
  }

  const totalCount = batch.totalCount || batch.products.length;
  const pageCount = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const result: OpenFoodFactsSearchPage = {
    products: batch.products.slice(batchOffset, batchOffset + pageSize),
    page,
    pageSize,
    pageCount,
    totalCount,
    hasMore: page < pageCount,
  };

  searchCache.set(cacheKey, result);
  return result;
};

export const searchOpenFoodFacts = async (query: string, pageSize = 8) => {
  const result = await searchOpenFoodFactsPage(query, 1, pageSize);
  return result.products;
};

export const getData = async (barcode: string) => {
  const trimmedBarcode = barcode.trim();
  if (!trimmedBarcode) return undefined;

  const cached = productCache.get(trimmedBarcode);
  if (cached) {
    return cached;
  }

  const url = `${OFF_BASE_URL}/api/v2/product/${trimmedBarcode}?fields=${PRODUCT_FIELDS}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Open Food Facts product lookup failed: ${response.status}`);
  }

  const json = await response.json() as ProductResult;
  const normalizedProduct = normalizeProduct(json.product as unknown as Record<string, unknown>, trimmedBarcode);
  if ((json.status ?? 1) !== 1 || !normalizedProduct) {
    return undefined;
  }

  const result: ProductResult = {
    ...json,
    code: trimmedBarcode,
    product: normalizedProduct,
  };
  productCache.set(trimmedBarcode, result);
  return result;
};
