import {
    Dimensions,
    Image,
    StyleSheet,
    TouchableOpacity,
    Alert
} from "react-native";
import React from "react";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useNavigation } from "@react-navigation/native";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import { useKeyStore } from "../../stores/KeyStore";
import Toast from "react-native-toast-message";

// 브라우저 닫기 처리
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

const GoogleLoginComponent = () => {
    const navigation = useNavigation();
    const { setUser } = useUserStore(state => state.setter);
    const keyStore = useKeyStore();

    const handleGoogleLogin = async () => {
        try {
            // 1. 리다이렉트 URL 생성
            const redirectUrl = Linking.createURL('auth/callback');
            console.log('Google Redirect URL:', redirectUrl);

            // 2. Supabase에 로그인 요청 (provider: 'google')
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;

            // 3. 브라우저 열기
            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                // 4. 로그인 성공 처리
                if (result.type === 'success' && result.url) {
                    // URL에서 토큰 파싱
                    const params = new URLSearchParams(result.url.split('#')[1] || result.url.split('?')[1]);
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        // A. Supabase 세션 설정
                        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });

                        if (sessionError) throw sessionError;

                        // B. 'user' 테이블에서 내 정보 가져오기 
                        const { data: userData, error: userError } = await supabase
                            .from("user")
                            .select("*")
                            .eq("user_id", sessionData.user.id)
                            .single();

                        if (userError) {
                            console.error("User fetch error:", userError);
                            Alert.alert("알림", "유저 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
                            return;
                        }

                        if (userData) {
                            console.log("Google User Info:", userData);

                            // C. 스토어에 유저 정보 저장
                            setUser(
                                userData.name,
                                userData.user_id,
                                userData.email,
                                userData.birth_date,
                                userData.categories
                            );

                            // 마이페이지 코인 정보 조회
                            const { data: mp } = await supabase
                                .from("mypage")
                                .select("mp_coin")
                                .eq("user_id", userData.user_id)
                                .single();

                            // 코인 설정
                            useUserStore.getState().setter.setCoin(mp?.mp_coin ?? 0);

                            // 키 스토어 설정
                            keyStore.setter.setClear();
                            await keyStore.setter.setKey();

                            // 성공 메시지
                            Toast.show({
                                type: 'success',
                                text1: '로그인 성공',
                                text2: `${userData.name}님, 환영합니다 👋`,
                            });

                            // D. 메인 화면으로 이동
                            navigation.replace("TabNavigator");
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Google Login Error:", error);
            Alert.alert("구글 로그인 실패", error.message);
        }
    };

    return (
        <TouchableOpacity onPress={handleGoogleLogin}>
            <Image
                style={styles.image}
                source={require("../../assets/google_login.png")}
                resizeMode={"contain"}
            />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    image: {
        width: width * 0.85,
        height: height * 0.08,
        alignSelf: "center"
    },
});

export default GoogleLoginComponent;