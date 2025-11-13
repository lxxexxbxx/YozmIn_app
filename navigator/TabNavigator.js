import React, { useState } from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome6";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TouchableOpacity } from "react-native";
import HomeComponent from "../components/home/HomeComponent";
import TrendComponent from "../components/trend/TrendComponent";
import BoardComponent from "../components/board/BoardComponent";
import NewsComponent from "../components/news/NewsComponent";
import MyPageComponent from "../components/mypage/MyPageComponent";
import { useTheme } from "../components/settings/theme/ThemeContext"; // ✅ 테마 가져오기

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [trendKey, setTrendKey] = useState(0);
  const { colors, isDark } = useTheme(); // ✅ 테마 상태

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // ✅ 배경 / 테두리 / 텍스트 색상 테마 반영
        tabBarStyle: {
          backgroundColor: colors.boxBackground,
          borderTopColor: colors.border,
          borderTopWidth: 0.6,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        tabBarActiveTintColor: isDark ? "#FFB74D" : "tomato", // 선택된 탭 색
        tabBarInactiveTintColor: isDark ? "#BBBBBB" : "gray", // 미선택 탭 색
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "house-chimney-window";
          else if (route.name === "Trend") iconName = "house-fire";
          else if (route.name === "Board") iconName = "list";
          else if (route.name === "News") iconName = "newspaper";
          else if (route.name === "MyPage") iconName = "user-tie";

          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={() => {
              setTrendKey((prev) => prev + 1);
              props.onPress?.();
            }}
          />
        ),
      })}
    >
      {/* 홈 */}
      <Tab.Screen
        name="Home"
        component={HomeComponent}
        options={{
          headerTitle: "요 즘 사 람",
          headerTintColor: colors.text,
        }}
      />

      {/* 트렌드 */}
      <Tab.Screen
        name="Trend"
        component={TrendComponent}
        options={{ headerShown: false }}
      />

      {/* 게시판 */}
      <Tab.Screen
        name="Board"
        component={BoardComponent}
        options={{ headerShown: false }}
      />

      {/* 뉴스 */}
      <Tab.Screen
        name="News"
        component={NewsComponent}
        options={{ headerShown: false }}
      />

      {/* 마이페이지 */}
      <Tab.Screen
        name="MyPage"
        component={MyPageComponent}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
