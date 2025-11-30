import React from "react";
import {
    Dimensions,
    Platform,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    StyleSheet
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { PaperProvider } from "react-native-paper";

// Components
import MovieListComponent from "./movie/MovieListComponent";
import HotPlaceComponent from "./hotPlace/HotPlaceComponent";
import MemeDictionaryComponent from "./meme/MemeDictionaryComponent";
import { ThemeView, ThemeText } from "../common/ThemeComponents";

// Stores & Context
import { useUserStore } from "../../stores/UserStore";
import { useTheme } from "../settings/theme/ThemeContext";

const Tab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get("window");

// 🎨 1. 사용자 정의 탭바 컴포넌트 (캡슐 모양 디자인)
function CustomTabBar({ state, descriptors, navigation, colors }) {
    return (
        <ThemeView style={[styles.tabBarContainer, { backgroundColor: colors.background }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={{ flexGrow: 0 }} // 스크롤뷰 높이 고정
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    // 라벨 가져오기 (tabBarLabel이 없으면 title, 그것도 없으면 name 사용)
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    // 현재 탭이 활성화 상태인지 확인
                    const isFocused = state.index === index;

                    // 탭 클릭 이벤트 핸들러
                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={[
                                styles.tabButton,
                                {
                                    // 활성화되면 파란색, 비활성화면 테마에 맞는 연한 회색/어두운 회색
                                    backgroundColor: isFocused
                                        ? "rgba(118, 166, 255, 1)"
                                        : colors.card, // colors.card는 보통 연한 회색(Light)이나 짙은 회색(Dark)
                                    borderColor: colors.border,
                                    borderWidth: isFocused ? 0 : 1, // 비활성화일 때 얇은 테두리 (선택사항)
                                }
                            ]}
                        >
                            <ThemeText
                                style={{
                                    // 활성화되면 흰색, 비활성화면 테마 텍스트 색상
                                    color: isFocused ? "#FFFFFF" : colors.text,
                                    fontWeight: "700",
                                    fontSize: 14,
                                }}
                            >
                                {label}
                            </ThemeText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </ThemeView>
    );
}

// 🏗️ 2. 메인 네비게이터
export default function TrendNavigator() {
    const store = useUserStore();
    const { colors } = useTheme();

    // 카테고리 로직 (기존 코드와 동일)
    const categories = store.categories ? store.categories.split(",") : [];

    return (
        <PaperProvider>
            <ThemeView style={{ flex: 1, backgroundColor: colors.background }}>
                <Tab.Navigator
                    // 🌟 핵심: 여기서 커스텀 탭바를 주입합니다.
                    tabBar={(props) => <CustomTabBar {...props} colors={colors} />}
                    screenOptions={{
                        swipeEnabled: true, // 스와이프 기능 유지
                        animationEnabled: true, // 부드러운 전환
                    }}
                >
                    {/* 👇 기존의 탭 생성 로직 100% 동일 유지 👇 */}
                    {categories.length > 0 ? (
                        <>
                            {categories.includes("ent_movie") && (
                                <Tab.Screen
                                    name="🍿영화" // 탭바에 표시될 이름
                                >
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
                        // 카테고리가 없을 때 기본값
                        <>
                            <Tab.Screen name="📺시리즈">
                                {() => <MovieListComponent category="tv_popular" />}
                            </Tab.Screen>
                            <Tab.Screen name="😎밈" component={MemeDictionaryComponent} />
                        </>
                    )}
                </Tab.Navigator>
            </ThemeView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: 'row',
        paddingVertical: 12, // 상하 여백
        paddingLeft: 16, // 왼쪽 시작 여백
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)', // 아주 연한 구분선
        elevation: 0,
    },
    scrollContent: {
        gap: 8, // 버튼 사이 간격 (React Native 0.71+)
        paddingRight: 32, // 오른쪽 끝 여백
        alignItems: 'center',
    },
    tabButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20, // 캡슐 모양 (높이의 절반 정도)
        justifyContent: 'center',
        alignItems: 'center',
    }
});