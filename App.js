import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import HomeComponent from "./components/home/HomeComponent";
import TrendComponent from "./components/trend/TrendComponent";
import BoardComponent from "./components/board/BoardComponent";
import NewsComponent from "./components/news/NewsComponent";
import MyPageComponent from "./components/mypage/MyPageComponent";
import {NavigationContainer} from "@react-navigation/native";
import FontAwesome from "react-native-vector-icons/FontAwesome6";

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
                if(route.name === "Home") {
                    iconName = "house-chimney-window";
                }
                else if(route.name === "Trend") {
                    iconName = "house-fire";
                }
                else if(route.name === "Board") {
                    iconName = "list";
                }
                else if(route.name === "News") {
                    iconName = "newspaper";
                }
                else if(route.name === "MyPage") {
                    iconName = "user-tie";
                }

                return <FontAwesome name={iconName} size={size} color={color}/>;
              },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
        })}
        >
          <Tab.Screen name={"Home"} component={HomeComponent} options={{ headerTitle: "요 즘 사 람" }}/>
          <Tab.Screen name={"Trend"} component={TrendComponent} options={{ headerShown: false, animationEnabled: false }}/>
          <Tab.Screen name={"Board"} component={BoardComponent} options={{ headerShown: false }}/>
          <Tab.Screen name={"News"} component={NewsComponent} options={{ headerShown: false }}/>
          <Tab.Screen name={"MyPage"} component={MyPageComponent} options={{ headerShown: false }}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
}




export default App;