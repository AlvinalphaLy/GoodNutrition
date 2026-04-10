import { useLocalSearchParams } from "expo-router";
import { Text } from "@react-navigation/elements";
import { View } from "react-native";
import { useState, useEffect } from "react";
import getData from "./api/openFoodFacts";

export default function ProductResult() {
  const { code } = useLocalSearchParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getData(code);
      setProduct(data);
    }

    load();
  }, [code]);

  useEffect(() => {});

  return (
    <View>
      <Text>{JSON.stringify(product)}</Text>
    </View>
  );
}
