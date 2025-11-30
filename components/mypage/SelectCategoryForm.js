import React, {useEffect} from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import {useUserStore} from "../../stores/UserStore";
import supabase from "../../supabase";
import {useNavigation} from "@react-navigation/native";
import {CommonUtils} from "../common/CommonUtils";

const { width, height } = Dimensions.get('window');

const SignUpCompleteForm = () => {
    const store = useUserStore();
    const navigation = useNavigation();

    const insertUser = async () => {
        if(!store.name || !store.user_id || !store.password ||
            !store.email || !store.birth_date) {
            navigation.navigate("Login");
            return;
        }

        const userTableResponse = await supabase
            .from("user")
            .insert([{
                name: store.name,
                user_id: store.user_id,
                password: store.password,
                email: store.email,
                birth_date: store.birth_date
            }]);

        const mypageTableResponse = await supabase
            .from("mypage")
            .insert([{
                mp_Name: "티노",
                user_id: store.user_id,
                mp_Level: 0,
                mp_Coin: 0,
                mp_coin: 0,
            }]);

        if(userTableResponse.status === 201 && mypageTableResponse.status === 201) {
            console.log("등록 성공");
        }
        else if(userTableResponse.status !== 201){
            console.log("등록 실패[user]:", userTableResponse.error);
        }
        else if(mypageTableResponse.status !== 201){
            console.log("등록 실패[mypage]:", mypageTableResponse.error);
        }
    }

    useEffect(() => {
        CommonUtils.noGoBack();
        insertUser();
        store.setter.setClear();
        setTimeout(() => {
            navigation.replace("TabNavigator");
        }, 3000);
    }, []);

    return (
        <View style={styles.Container}>
            <ImageBackground style={styles.clap} source={require("../../assets/clap.jpeg")}/>
            <View style={styles.label}>
                <Text style={styles.text}>
                    {`축하해요! \n요즘사람이 되실 준비가 끝났어요.`}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    Container: {
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 1)",
        display: "flex",
        flexDirection: "column",
    },
    label: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "rgba(0, 0, 0, 1)",
        fontFamily: "Share",
        fontSize: width * 0.06, // 화면 너비에 비례
    },
    clap: {
        flex:1,
        position: "absolute",
        flexShrink: 0,
        top: height * 0.30, // 화면 높이에 비례
        left: width * 0.65, // 화면 너비에 비례
        width: width * 0.18, // 화면 너비에 비례
        height: width * 0.18, // 화면 너비에 비례 (정사각형 유지)
        transform: [{ rotateZ: "10.33deg" }]
    }
});

export default SignUpCompleteForm;