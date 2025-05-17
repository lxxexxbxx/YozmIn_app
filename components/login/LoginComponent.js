import {StyleSheet, Text, TextInput, View, Dimensions, Button, TouchableOpacity} from "react-native";
import React, {useEffect, useState} from "react";
import KakaoLoginComponent from "./KakaoLoginComponent";
import {useNavigation} from "@react-navigation/native";
import {CommonUtils} from "../common/CommonUtils";

const {width, height} = Dimensions.get("window");

const LoginComponent = (registered) => {
    const navigation = useNavigation();

    const [id, setId] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        // CommonUtils.noGoBack();
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>요즘사람</Text>
            <TextInput style={styles.inputBox} value={id} onChangeText={setId} placeholder={"아이디"}/>
            <TextInput style={styles.inputBox} value={password} onChangeText={setPassword} secureTextEntry={true}
                       autoComplete={"password"} placeholder={"비밀번호"}/>
            <Button title={"로그인"} onPress={() => navigation.navigate("StartForm")}/>
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
    inputBox: {
        width: width - 20 * 2,
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