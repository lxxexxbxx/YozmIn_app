import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import MovieListComponent from "../movie/MovieListComponent";
import {Dimensions, Platform, StatusBar, View} from "react-native";

const Tab = createMaterialTopTabNavigator();
const {height} = Dimensions.get("window");

export default function TrendNavigator() {
    const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight : 0; // 휴대폰 상단 상태바 크기

    return (
        <View style={{flex: 1, marginTop: Platform.OS === "ios" ? height * -0.0555 : statusBarHeight}}>
            {/*<PageTitleComponent backToTab={"Trend"}/>*/}
            <Tab.Navigator>
                <Tab.Screen name="인기 영화">
                    {() => <MovieListComponent category="movie_popular" />}
                </Tab.Screen>
                <Tab.Screen name="TV 시리즈">
                    {() => <MovieListComponent category="tv_popular" />}
                </Tab.Screen>
            </Tab.Navigator>
        </View>
    );
}
