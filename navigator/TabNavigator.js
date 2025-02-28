import FontAwesome from "react-native-vector-icons/FontAwesome6";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import HomeComponent from "../components/home/HomeComponent";
import TrendComponent from "../components/trend/TrendComponent";
import BoardComponent from "../components/board/BoardComponent";
import NewsComponent from "../components/news/NewsComponent";
import MyPageComponent from "../components/mypage/MyPageComponent";

const Tab = createBottomTabNavigator();

// 하단 바 네비게이터
const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                // 하단 바 아이콘 설정
                tabBarIcon: ({color, size}) => {
                    let iconName;
                    if (route.name === "Home") {
                        iconName = "house-chimney-window";
                    } else if (route.name === "Trend") {
                        iconName = "house-fire";
                    } else if (route.name === "Board") {
                        iconName = "list";
                    } else if (route.name === "News") {
                        iconName = "newspaper";
                    } else if (route.name === "MyPage") {
                        iconName = "user-tie";
                    }

                    return <FontAwesome name={iconName} size={size} color={color}/>; //FontAwesome6 아이콘 사용
                },
                tabBarActiveTintColor: 'tomato', // 선택 탭 색
                tabBarInactiveTintColor: 'gray', // 미선택 탭 색
            })}
        >
            {/*홈*/}
            <Tab.Screen name={"Home"} component={HomeComponent} options={{headerTitle: "요 즘 사 람"}}/>
            {/*트렌드*/}
            <Tab.Screen name={"Trend"} component={TrendComponent}
                        options={{headerShown: false, animationEnabled: false}}/>
            {/*게시판*/}
            <Tab.Screen name={"Board"} component={BoardComponent} options={{headerShown: false}}/>
            {/*뉴스*/}
            <Tab.Screen name={"News"} component={NewsComponent} options={{headerShown: false}}/>
            {/*마이페이지*/}
            <Tab.Screen name={"MyPage"} component={MyPageComponent} options={{headerShown: false}}/>
        </Tab.Navigator>
    )
}

export default TabNavigator;