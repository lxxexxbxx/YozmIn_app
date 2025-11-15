import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import MovieListComponent from "./movie/MovieListComponent";
import HotPlaceComponent from "./hotPlace/HotPlaceComponent";
import { Platform, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";   // ⭐ 중요
import { useUserStore } from "../../stores/UserStore";
import { useTheme } from "../settings/theme/ThemeContext";

const Tab = createMaterialTopTabNavigator();

export default function TrendNavigator() {
  const store = useUserStore();
  const { colors, isDark } = useTheme();
  const categories = store.categories ? store.categories.split(",") : [];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,  // ⭐ iOS 상단 SafeArea 색 통일
      }}
      edges={["top"]}    // ⭐ top safe area만 적용
    >
      {/* StatusBar 색 적용 */}
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.background}
      />

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: isDark ? "#9BB8FB" : "#2F80ED",
            height: 3,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "bold",
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.subText,
        }}
      >
        {categories.length > 0 ? (
          <>
            {categories.includes("ent_movie") && (
              <Tab.Screen name="인기 영화">
                {() => <MovieListComponent category="movie_popular" />}
              </Tab.Screen>
            )}

            {categories.includes("ent_drama") && (
              <Tab.Screen name="TV 시리즈">
                {() => <MovieListComponent category="tv_popular" />}
              </Tab.Screen>
            )}

            {(categories.includes("food_restaurant") ||
              categories.includes("food_coffee") ||
              categories.includes("food_dessert") ||
              categories.includes("food_sushi")) && (
              <Tab.Screen name="🔥핫플" component={HotPlaceComponent} />
            )}
          </>
        ) : (
          <Tab.Screen name="TV 시리즈">
            {() => <MovieListComponent category="tv_popular" />}
          </Tab.Screen>
        )}
      </Tab.Navigator>
    </SafeAreaView>
  );
}
