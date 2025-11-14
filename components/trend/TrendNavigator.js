import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import MovieListComponent from "./movie/MovieListComponent";
import { Dimensions, Platform, StatusBar, View } from "react-native";
import { useUserStore } from "../../stores/UserStore";
import HotPlaceComponent from "./hotPlace/HotPlaceComponent";
import MemeDictionaryComponent from "./meme/MemeDictionaryComponent";
import {PaperProvider} from "react-native-paper";

const Tab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get("window");

export default function TrendNavigator() {
    const store = useUserStore();
    const categories = store.categories ? store.categories.split(",") : [];
    const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight : 0; // 휴대폰 상단 상태바 크기

    // 탭 개수 계산 (밈 포함)
    const tabCount =
        categories.length > 0
            ? (categories.includes("ent_movie") ? 1 : 0) +
            (categories.includes("ent_drama") ? 1 : 0) +
            ((categories.includes("food_restaurant") ||
                categories.includes("food_coffee") ||
                categories.includes("food_dessert") ||
                categories.includes("food_sushi")) ? 1 : 0) +
            1 // 😎 밈
            : 2; // 기본 (시리즈 + 밈)

    // 탭 너비 계산 (최소 100px 보장)
    const itemWidth = Math.max(width / tabCount, 100);

    return (
        // <PaperProvider>
            <View style={{ flex: 1, marginTop: Platform.OS === "ios" ? height * 0.04 : statusBarHeight }}>
                <Tab.Navigator
                    screenOptions={{
                        swipeEnabled: false, // 옆으로 스와이프 방지
                        tabBarScrollEnabled: true, // 탭 많아지면 스크롤 가능
                        tabBarItemStyle: { width: itemWidth }, // 탭 개수 적으면 균등 분배
                        tabBarIndicatorStyle: {
                            backgroundColor: "#111",
                            height: 3,
                            borderRadius: 3,
                        },
                        tabBarStyle: {
                            backgroundColor: "#fff",
                            elevation: 0,
                            shadowOpacity: 0,
                            borderBottomWidth: 0.5,
                            borderBottomColor: "#eee",
                        },
                        tabBarLabelStyle: {
                            fontSize: 14,
                            fontWeight: "700",
                            textTransform: "none",
                        },
                        tabBarActiveTintColor: "#111",
                        tabBarInactiveTintColor: "#999",
                    }}
                >
                    {categories.length > 0 ? (
                        <>
                            {categories.includes("ent_movie") && (
                                <Tab.Screen name="🍿영화">
                                    {() => <MovieListComponent category="movie_popular" />}
                                </Tab.Screen>
                            )}
                            {categories.includes("ent_drama") && (
                                <Tab.Screen name="📺시리즈">
                                    {() => <MovieListComponent category="tv_popular" />}
                                </Tab.Screen>
                            )}
                            {(categories.includes("food_restaurant") ||
                                categories.includes("food_coffee") ||
                                categories.includes("food_dessert") ||
                                categories.includes("food_sushi")) && (
                                <Tab.Screen name="🔥핫플" component={HotPlaceComponent} />
                            )}
                            <Tab.Screen name="😎밈" component={MemeDictionaryComponent} />
                        </>
                    ) : (
                        <>
                            <Tab.Screen name="📺시리즈">
                                {() => <MovieListComponent category="tv_popular" />}
                            </Tab.Screen>
                            <Tab.Screen name="😎밈" component={MemeDictionaryComponent} />
                        </>
                    )}
                </Tab.Navigator>
            </View>
        // </PaperProvider>
    );
}
