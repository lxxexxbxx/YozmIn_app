import {createStackNavigator} from '@react-navigation/stack';
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
import BeforeLoginForm from "../form/BeforeLoginForm";
import MovieDetailComponent from "../components/trend/movie/MovieDetailComponent";
import TrendNavigator from "../components/trend/TrendNavigator";
import StartForm from "../form/StartForm";
import SignUpNameForm from "../components/signup/SignUpNameForm";
import SignUpIdForm from "../components/signup/SignUpIdForm";
import SignUpPwForm from "../components/signup/SignUpPwForm";
import SignUpBirthDateForm from "../components/signup/SignUpBirthDateForm";
import SignUpEmailForm from "../components/signup/SignUpEmailForm";
import SignUpCompleteForm from "../components/signup/SignUpCompleteForm";
import SignUpComponent from "../components/signup/SignUpComponent";
import SelectCategoryForm from "../components/home/SelectCategoryForm";
import GameDetailComponent from "../components/trend/game/GameDetailComponent";
import ShopComponent from "../components/shop/ShopComponent";
import ClosetScreen from "../components/closet/ClosetScreen";
import TodayQuestsScreen from '../components/quest/TodayQuestsScreen';
import MemeDetailsComponent from "../components/trend/meme/MemeDetailsComponent";
import BookmarkDetailComponent from "../components/bookmark/BookmarkDetailComponent";
import {useTheme} from "../components/settings/theme/ThemeContext";

const Stack = createStackNavigator();

const Navigator = () => {
    const { colors } = useTheme();

    return (
        <NavigationContainer style={{backgroundColor: colors.background}}>
            <Stack.Navigator initialRouteName={"BeforeLogin"}>
                {/*디자인 폼*/}
                <Stack.Screen name={"BeforeLogin"} component={BeforeLoginForm} options={{headerShown: false}}/>
                <Stack.Screen name={"StartForm"} component={StartForm} options={{headerShown: false}}/>

                {/*회원가입 컴포넌트*/}
                <Stack.Screen name={"SignUp"} component={SignUpComponent} options={{headerShown: false}}/>
                {/*회원가입 폼*/}
                <Stack.Screen name={"SignUpName"} component={SignUpNameForm} options={{headerShown: false}}/>
                <Stack.Screen name={"SignUpId"} component={SignUpIdForm} options={{headerShown: false}}/>
                <Stack.Screen name={"SignUpPw"} component={SignUpPwForm} options={{headerShown: false}}/>
                <Stack.Screen name={"SignUpEmail"} component={SignUpEmailForm} options={{headerShown: false}}/>
                <Stack.Screen name={"SignUpBirthDate"} component={SignUpBirthDateForm} options={{headerShown: false}}/>
                <Stack.Screen name={"SignUpComplete"} component={SignUpCompleteForm} options={{headerShown: false}}/>
                <Stack.Screen name={"SelectCategory"} component={SelectCategoryForm} options={{headerShown: false}}/>

                {/*로그인 컴포넌트*/}
                <Stack.Screen name={"Login"} component={LoginComponent} options={{headerShown: false}}/>
                {/*회원가입 컴포넌트*/}
                <Stack.Screen name={"LoginRegister"} component={RegisterComponent} options={{headerShown: false}}/>
                {/*하단 바 네비게이터*/}
                <Stack.Screen name={"TabNavigator"} component={TabNavigator} options={{headerShown: false}}/>
                {/*설정 컴포넌트 */}
                <Stack.Screen name={"SettingsScreen"} component={SettingsScreen} options={{headerShown: false}}/>
                {/* 일반설정 컴포넌트 */}
                <Stack.Screen name="GeneralSettings" component={GeneralSettings} options={{headerShown: false}}/>
                {/* 알림설정 컴포넌트 */}
                <Stack.Screen name="Notification" component={Notification} options={{headerShown: false}}/>
                {/* 게시글 상세화면 컴포넌트 */}
                <Stack.Screen name="PostDetail" component={PostDetailComponent} options={{headerShown: false}}/>
                {/* 북마크 컴포넌트 */}
                <Stack.Screen name="Bookmark" component={BookmarkComponent} options={{headerShown: false}}/>
                {/* 옷장 컴포넌트 */}
                {/* ------------------------- 뉴스 연결 네비게이션 ------------------------ */}
                {/* 뉴스 목록 페이지 */}
                <Stack.Screen name="NewsList" component={NewsComponent} options={{headerShown: false}}/>
                {/* 뉴스 상세 페이지 */}
                <Stack.Screen name="NewsDetail" component={NewsDetailComponent} options={{headerShown: false}}/>
                {/* ------------------------- 뉴스 연결 네비게이션 ------------------------ */}
                {/*트렌드 탭 내 네비게이터*/}
                <Stack.Screen name={"TrendNavigator"} component={TrendNavigator} options={{headerShown: false}}/>
                {/*영화 정보 상세*/}
                <Stack.Screen name={"TrendMovieDetail"} component={MovieDetailComponent} options={{headerShown: false}}/>
                {/*게임 정보 상세*/}
                <Stack.Screen name={"GameDetail"} component={GameDetailComponent} options={{headerShown: false}}/>
                {/*밈 정보 상세*/}
                <Stack.Screen name={"MemeDetail"} component={MemeDetailsComponent} options={{headerShown: false}}/>


                <Stack.Screen name="Shop" component={ShopComponent} options={{ headerShown: false }} />

                <Stack.Screen name="closet" component={ClosetScreen} options={{ headerShown: false }} />

                <Stack.Screen name="TodayQuests" component={TodayQuestsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="BookmarkDetail" component={BookmarkDetailComponent} options={{headerShown: false}}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default Navigator;