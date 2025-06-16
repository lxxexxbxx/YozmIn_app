import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import MovieListComponent from "../movie/MovieListComponent";
import {Dimensions, Platform, StatusBar, View} from "react-native";
import GameTrendComponent from "../game/GameTrendComponent";
import {useUserStore} from "../../../stores/UserStore";

const Tab = createMaterialTopTabNavigator();
const {height} = Dimensions.get("window");

export default function TrendNavigator() {
    const store = useUserStore();
    const categories = store.categories ? store.categories.split(',') : [];
    console.log(categories);
    const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight : 0; // 휴대폰 상단 상태바 크기

    return (
        <View style={{flex: 1, marginTop: Platform.OS === "ios" ? height * 0.04 : statusBarHeight}}>
            {/*<PageTitleComponent backToTab={"Trend"}/>*/}
            <Tab.Navigator>
                {categories.some(c => ["ent_movie", "ent_drama", "ent_game"].includes(c)) ? (
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
                        {categories.includes("ent_game") && (
                            <Tab.Screen name={"인기 게임"} component={GameTrendComponent}/>
                        )}
                    </>
                    ) : (
                        <Tab.Screen name="TV 시리즈">
                            {() => <MovieListComponent category="tv_popular" />}
                        </Tab.Screen>
                    )}
            </Tab.Navigator>
        </View>
    );
}
