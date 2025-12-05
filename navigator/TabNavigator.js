import FontAwesome from "react-native-vector-icons/FontAwesome6";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import HomeComponent from "../components/home/HomeComponent";
import TrendComponent from "../components/trend/TrendComponent";
import BoardComponent from "../components/board/BoardComponent";
import NewsComponent from "../components/news/NewsComponent";
import MyPageComponent from "../components/mypage/MyPageComponent";
import {Image, TouchableOpacity} from "react-native";
import {useState} from "react";
import {useTheme} from "../components/settings/theme/ThemeContext";
import {ThemeView, ThemeText} from "../components/common/ThemeComponents";

const Tab = createBottomTabNavigator();

// 하단 바 네비게이터
const TabNavigator = () => {
    const [trendKey, setTrendKey] = useState(0);
    const {colors, isDark} = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                // 하단 바 스타일 지정
                tabBarStyle: {backgroundColor: colors.background},
                tabBarActiveTintColor: 'rgba(118, 166, 255, 1)', // 선택 탭 색
                tabBarInactiveTintColor: 'gray', // 미선택 탭 색
                tabBarButton: (props) => (
                    <TouchableOpacity
                        {...props}
                        onPress={() => {
                            setTrendKey((prev) => prev + 1); // 탭을 다시 누르면 새로운 key로 변경하여 화면 리렌더링
                            props.onPress?.();
                        }}
                    />
                ),
            })}
        >
            {/*홈*/}
            <Tab.Screen name={"요즈미채팅"} component={HomeComponent}
                        options={{
                            headerTitle: "",
                            headerLeft: () => (
                                <>
                                    <Image source={
                                        require("../assets/Yozmin_Logo_v0.1.png")
                                    } style={{width: 60, height: 60, resizeMode: "contain", marginLeft: 15}}
                                    />
                                    <ThemeText style={{fontSize: 20, marginLeft: 5}}>{"요즘사람"}</ThemeText>
                                </>
                            ),
                            headerStyle: {backgroundColor: colors.background},
                            headerTintColor: colors.text,
                            tabBarIcon: ({focused}) => (
                                <Image source={
                                    focused ? require("../assets/home_icon_on.png") :
                                        require("../assets/home_icon_off.png")
                                } style={{width: 24, height: 24, resizeMode: "contain"}}
                                />
                            ),
                        }}
            />
            {/*트렌드*/}
            {/*<Tab.Screen name={"Trend"} options={{headerShown: false, animationEnabled: false}}>*/}
            {/*    {() => <TrendComponent key={trendKey}/>}*/}
            {/*</Tab.Screen>*/}
            <Tab.Screen name={"트렌드"} component={TrendComponent}
                        options={{
                            headerLeft: () => (
                                <>
                                    <Image source={
                                        require("../assets/Yozmin_Logo_v0.1.png")
                                    } style={{width: 60, height: 60, resizeMode: "contain", marginLeft: 15}}
                                    />
                                </>
                            ),
                            headerStyle: {backgroundColor: colors.background},
                            headerTintColor: colors.text,
                            tabBarIcon: ({focused}) => (
                                <Image source={
                                    focused ? require("../assets/trend_icon_on.png") :
                                        require("../assets/trend_icon_off.png")
                                } style={{width: 24, height: 24, resizeMode: "contain"}}
                                />
                            ),
                        }}/>
            {/*게시판*/}
            <Tab.Screen name={"게시판"} component={BoardComponent}
                        options={{
                            headerLeft: () => (
                                <>
                                    <Image source={
                                        require("../assets/Yozmin_Logo_v0.1.png")
                                    } style={{width: 60, height: 60, resizeMode: "contain", marginLeft: 15}}
                                    />
                                </>
                            ),
                            headerStyle: {backgroundColor: colors.background},
                            headerTintColor: colors.text,
                            tabBarIcon: ({focused}) => (
                                <Image source={
                                    focused ? require("../assets/board_icon_on.png") :
                                        require("../assets/board_icon_off.png")
                                } style={{width: 24, height: 24, resizeMode: "contain"}}
                                />
                            ),
                        }}/>
            {/*뉴스*/}
            <Tab.Screen name={"뉴스"} component={NewsComponent}
                        options={{
                            headerLeft: () => (
                                <>
                                    <Image source={
                                        require("../assets/Yozmin_Logo_v0.1.png")
                                    } style={{width: 60, height: 60, resizeMode: "contain", marginLeft: 15}}
                                    />
                                </>
                            ),
                            headerStyle: {backgroundColor: colors.background},
                            headerTintColor: colors.text,
                            tabBarIcon: ({focused}) => (
                                <Image source={
                                    focused ? require("../assets/news_icon_on.png") :
                                        require("../assets/news_icon_off.png")
                                } style={{width: 24, height: 24, resizeMode: "contain"}}
                                />
                            ),
                        }}/>
            {/*마이페이지*/}
            <Tab.Screen name={"마이페이지"} component={MyPageComponent}
                        options={{
                            headerShown : false,
                            tabBarIcon: ({focused}) => (
                                <Image source={
                                    focused ? require("../assets/mypage_icon_on.png") :
                                        require("../assets/mypage_icon_off.png")
                                } style={{width: 24, height: 24, resizeMode: "contain"}}
                                />
                            ),
                        }}/>
        </Tab.Navigator>
    )
}

export default TabNavigator;