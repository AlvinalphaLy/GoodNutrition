import { useLocalSearchParams } from "expo-router";
import { Text } from "@react-navigation/elements";
import { View } from "react-native";
import { useState, useEffect } from "react";
import getData, { ProductResult } from "./api/openFoodFacts";

export default function Product() {
  const { code } = useLocalSearchParams();
  const [product, setProduct] = useState<ProductResult | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getData(code);
      // Narrow to silence undefined error
      if (data) {
        setProduct(data);
        processResult(data);
      }
    }
    load();
  }, [code]);

  return (
    <View>
      <Text>{JSON.stringify(product)}</Text>
    </View>
  );
}

const processResult = (data: ProductResult) => {
  console.log(data.status_verbose);
  console.log(data.product.brands);
  console.log(data.product.product_name);
  console.log(data.product.nova_group);
  console.log(data.product.nutriscore_grade);
  console.log(data.product.nutrient_levels);
  console.log(data.product.serving_size);
  console.log(data.product.nutriments);
};
