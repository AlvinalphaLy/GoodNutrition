export default async function getData(query: string | string[]) {
  const url = `https://world.openfoodfacts.net/api/v2/product/${query}?fields=product_name,brands,nutriscore_grade,nutriscore_score,nova_group,ingredients_text,additives_tags,allergens_tags,nutriments.energy-kcal_100g,nutriments.proteins_100g,nutriments.carbohydrates_100g,nutriments.fat_100g,nutriments.sugars_100g,nutriments.fiber_100g,nutriments.salt_100g,status_verbose`;

  let result;

  try {
    const response = await fetch(url, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    result = await response.json();
  } catch (error) {
    console.log(error);
  }

  return result;
}
