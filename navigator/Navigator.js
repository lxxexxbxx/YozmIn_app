import {createStackNavigator} from "@react-navigation/native/src/__stubs__/createStackNavigator";
import {NavigationContainer} from "@react-navigation/native";
import {useEffect} from "react";
import TabNavigator from "./TabNavigator";
import LoginComponent from "../components/login/LoginComponent";
import RegisterComponent from "../components/login/RegisterComponent";
import SettingsScreen from "../components/settings/SettingsComponent";
import GeneralSettings from "../components/settings/GeneralSettingsComponent"; 
import Notification from "../components/settings/NotificationComponent"; 
import PostDetailComponent from '../components/board/PostDetailComponent';
import BookmarkComponent from "../components/bookmark/BookmarkComponent";
import ClosetComponent from "../components/closet/ClosetComponent";


const Stack = createStackNavigator();

const Navigator = () => {
    useEffect(() => {

    }, []);

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={"Login"}>
                {/*로그인 컴포넌트*/}
                <Stack.Screen name={"Login"} component={LoginComponent}/>
                {/*회원가입 컴포넌트*/}
                <Stack.Screen name={"LoginRegister"} component={RegisterComponent}/>
                {/*하단 바 네비게이터*/}
                <Stack.Screen name={"TabNavigator"} component={TabNavigator}/>
                {/*설정 컴포넌트 */}
                <Stack.Screen name={"SettingsScreen"} component={SettingsScreen}/>
                {/* 일반설정 컴포넌트 */}
                <Stack.Screen name="GeneralSettings" component={GeneralSettings} /> 
                {/* 알림설정 컴포넌트 */}
                <Stack.Screen name="Notification" component={Notification} /> 
                {/* 게시글 상세화면 컴포넌트 */}
                <Stack.Screen name="PostDetail" component={PostDetailComponent} />
                {/* 북마크 컴포넌트 */}
                <Stack.Screen name="Bookmark" component={BookmarkComponent} />
                {/* 옷장장 컴포넌트 */}
                <Stack.Screen name="Closet" component={ClosetComponent} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default Navigator;