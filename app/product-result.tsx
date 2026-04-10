import { useLocalSearchParams } from "expo-router";
import { Text } from "@react-navigation/elements";
import { View } from "react-native";

export default function ProductResult() {
  const { code } = useLocalSearchParams();

  return (
    <View>
      <Text>{code}</Text>
    </View>
  );
}
