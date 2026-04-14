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
