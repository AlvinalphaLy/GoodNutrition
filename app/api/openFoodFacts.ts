export default async function getData(query: string | string[]) {
  const url = `https://world.openfoodfacts.net/api/v2/product/${query}?fields=product_name,nutriscore_data`;
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
