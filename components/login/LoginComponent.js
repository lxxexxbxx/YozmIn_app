import {StyleSheet, Text, TextInput, View, Dimensions, Button, TouchableOpacity, Image} from "react-native";
import React, {useEffect, useState} from "react";
import KakaoLoginComponent from "./KakaoLoginComponent";
import {useNavigation} from "@react-navigation/native";
import {CommonUtils} from "../common/CommonUtils";
import supabase from "../../supabase";
import SHA256 from "crypto-js/sha256";
import {Circle, Path, Svg} from "react-native-svg";
import Toast from "react-native-toast-message";
import {useUserStore} from "../../stores/UserStore";
import {useKeyStore} from "../../stores/KeyStore";

const {width, height} = Dimensions.get("window");

const LoginComponent = () => {
    const navigation = useNavigation();
    const userStore = useUserStore();
    const keyStore = useKeyStore();

    const [id, setId] = useState("");
    const [pw, setPw] = useState("");

    const [idError, setIdError] = useState("");
    const [pwError, setPwError] = useState("");

    const [pwHide, setPwHide] = useState(true);

    useEffect(() => {
        CommonUtils.noGoBack();
    });

    const login = async () => {
        setIdError("");
        setPwError("");
        setId(id.trim());
        setPw(pw.trim());

        if(!id) {
            setIdError("아이디를 입력해주세요.");
            return;
        }
        if(!pw) {
            setPwError("비밀번호를 입력해주세요.");
            return;
        }

        const hashedPw = SHA256(pw).toString();

        const response = await supabase
            .from("user")
            .select("*", { count: "exact"})
            .eq("user_id", `${id}`);

        if(response.status === 200) {
            if(response.data.length && response.count) {
                if(response.data[0].password === hashedPw) {
                    console.log("user_id:", response.data[0].user_id);
                    // 성공 메시지
                    Toast.show({
                        type: 'success',
                        text1: '로그인 성공',
                        text2: `${ response.data[0].name}님, 환영합니다 👋`,
                    });
                    userStore.setter.setClear();
                    userStore.setter.setUser(
                        response.data[0].name,
                        response.data[0].user_id,
                        response.data[0].email,
                        response.data[0].birth_date,
                        response.data[0].categories,
                    );
                    keyStore.setter.setClear();
                    await keyStore.setter.setKey();

                    if (useKeyStore.getState().GOOGLE_API_KEY) {
                        navigation.replace("TabNavigator");
                    } else {
                        console.warn("⚠️ 키 로드 실패");
                    }
                    // navigation.replace("TabNavigator")
                }
                else {
                    setPwError("비밀번호가 다릅니다.\n다시 입력해주세요.");
                    return;
                }
            }
        }
        else console.log("조회 실패:", response.error);

        setPwError("아이디 또는 비밀번호가 다릅니다.");
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>요즘사람</Text>
            <View style={styles.inputContainer}>
                <View style={{flexDirection: "row"}}>
                    <TextInput style={styles.inputBox} value={id}
                               placeholder={"아이디"}
                               onChangeText={(value) => {
                                   setId(value);
                                   setIdError("");
                               }}/>
                    <TouchableOpacity style={{flex: 1, marginBottom: 15, justifyContent: "center", alignItems: "center"}}
                                      onPress={() => setId("")}>
                        <Svg width="20" height="21" viewBox="0 0 20 21" fill="none" >
                            <Circle cx="10" cy="10.5" r="10" fill="#C7C7C7"/>
                            <Path d="M5.80005 6.30005L14.3 14.8" stroke="white" strokeWidth="2"/>
                            <Path d="M5.80005 14.8L14.3 6.30005" stroke="white" strokeWidth="2"/>
                        </Svg>
                    </TouchableOpacity>
                </View>
                {idError ? <Text style={{ color: 'red' }}>{idError}</Text> : null}
                <View style={{flexDirection: "row"}}>
                    <TextInput style={styles.inputBox} value={pw}
                               placeholder={"비밀번호"} secureTextEntry={pwHide}
                               onChangeText={(value) => {
                                   setPw(value);
                                   setPwError("");
                               }}/>
                    <TouchableOpacity style={{flex: 1, marginBottom: 15, justifyContent: "center", alignItems: "center"}}
                                      onPress={() => setPwHide(!pwHide)}>
                        {!pwHide ? <Image
                            source={require("../../assets/eye_opened.jpeg")}/> : <Image
                            source={require("../../assets/eye_closed.jpeg")}/>}
                    </TouchableOpacity>
                </View>
                {pwError ? <Text style={{ color: 'red' }}>{pwError}</Text> : null}
            </View>
            <Button title={"로그인"} onPress={() => login()}/>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("SignUp")}>
                <Text>회원가입</Text>
            </TouchableOpacity>
            <KakaoLoginComponent/>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#ffffff",
        padding: 20,
        flex: 1,
        justifyContent: "center",
    },
    title: {
        padding: 10,
        textAlign: "center",
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
    },
    text: {
        textAlign: "center",
        fontSize: 10,
    },
    inputContainer: {
        // alignItems: "center",
        marginBottom: 20,
    },
    inputBox: {
        width: width - 80,
        marginBottom: 20,
        borderBottomWidth: 1,
    },
    button: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },

})

export default LoginComponent;