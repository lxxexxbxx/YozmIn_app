import {createStackNavigator} from "@react-navigation/native/src/__stubs__/createStackNavigator";
import {NavigationContainer} from "@react-navigation/native";
import TabNavigator from "./TabNavigator";
import LoginComponent from "../components/login/LoginComponent";
import RegisterComponent from "../components/login/RegisterComponent";
import SettingsScreen from "../components/settings/SettingsComponent";
import GeneralSettings from "../components/settings/GeneralSettingsComponent"; 
import Notification from "../components/settings/NotificationComponent"; 
import PostDetailComponent from '../components/board/PostDetailComponent';
import NewsComponent from "../components/news/NewsComponent";
import NewsDetailComponent from "../components/news/NewsDetailComponent";
import BookmarkComponent from "../components/bookmark/BookmarkComponent";
import ClosetComponent from "../components/closet/ClosetComponent";
import BeforeLoginForm from "../form/BeforeLoginForm";
import MovieDetailComponent from "../components/trend/movie/MovieDetailComponent";
import TrendNavigator from "../components/trend/trendNavigator/TrendNavigator";
import StartForm from "../form/StartForm";
import LoginForm from "../form/LoginForm";

const Stack = createStackNavigator();

const Navigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={"StartForm"}>
                {/*디자인 폼*/}
                <Stack.Screen name={"BeforeLogin"} component={BeforeLoginForm}/>
                <Stack.Screen name={"LoginForm"} component={LoginForm}/>
                <Stack.Screen name={"StartForm"} component={StartForm}/>

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
                {/* ------------------------- 뉴스 연결 네비게이션 ------------------------ */}
                {/* 뉴스 목록 페이지 */}
                <Stack.Screen name="NewsList" component={NewsComponent}/>
                {/* 뉴스 상세 페이지 */}
                <Stack.Screen name="NewsDetail" component={NewsDetailComponent}/>
                {/* ------------------------- 뉴스 연결 네비게이션 ------------------------ */}
                {/*트렌드 탭 내 네비게이터*/}
                <Stack.Screen name={"TrendNavigator"} component={TrendNavigator}/>
                {/*영화 정보 상세*/}
                <Stack.Screen name={"TrendMovieDetail"} component={MovieDetailComponent}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default Navigator;