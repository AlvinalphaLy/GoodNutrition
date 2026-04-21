import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { ProfileProvider } from "../context/profileContext";

import { colors } from "../lib/colors";

export default function TabLayout() {
  return (
    <ProfileProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          headerTitleAlign: "center",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="meals"
          options={{
            title: "Meals",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "food-apple" : "food-apple-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-chat-tab"
          options={{
            title: "AI",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={
                  focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"
                }
                color={color}
                size={24}
              />
            ),
          }}
        />
      </Tabs>
    </ProfileProvider>
  );
}
