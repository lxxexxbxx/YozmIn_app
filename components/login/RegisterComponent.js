import {StyleSheet, Text, TextInput, View, Dimensions, ScrollView, TouchableOpacity, Pressable} from "react-native";
import React, {useEffect, useState} from "react";
import {useNavigation} from "@react-navigation/native";
import PageTitleComponent from "../common/PageTitleComponent";

const {width, height} = Dimensions.get("window"); // 화면 너비/높이

const RegisterComponent = () => {
    const navigation = useNavigation();
    const [btnStatus, setBtnStaus] = useState(true); // 회원가입 버튼 활성상태

    const [name, setName] = useState(""); // 이름
    const [nickname, setNickname] = useState(""); // 닉네임
    const [id, setId] = useState(""); // 아이디
    const [password, setPassword] = useState(""); // 비밀번호
    const [passwordCheck, setPasswordCheck] = useState(""); // 비밀번호 확인
    const [birthday, setBirthday] = useState(""); // 생년월일
    const [phone, setPhone] = useState(""); // 휴대폰번호
    const [email, setEmail] = useState(""); // 이메일

    let registered = {};

    // 회원가입 inputbox 값 변동 시마다 모든 값 비어있지 않은지 확인
    useEffect(() => {
        setBtnStaus(!(name && nickname && id && password && passwordCheck && birthday && phone && email));
    }, [name, nickname, id, password, passwordCheck, birthday, phone, email]);
    // 넘겨줄 값 초기화
    useEffect(() => {
        registered = {}
    }, []);

    const regist = () => {
        registered = {id: id, password: password};
        navigation.navigate("Login", registered);
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <PageTitleComponent title={"회원가입"}/>

            <Text style={styles.text}>이름</Text>
            <TextInput style={styles.inputBox} value={name} onChangeText={setName}/>
            <Text style={styles.text}>닉네임</Text>
            <TextInput style={styles.inputBox} value={nickname} onChangeText={setNickname}/>
            <Text style={styles.text}>아이디</Text>
            <TextInput style={styles.inputBox} value={id} onChangeText={setId}/>
            <Text style={styles.text}>비밀번호</Text>
            <TextInput style={styles.inputBox} value={password} onChangeText={setPassword} secureTextEntry={true}/>
            <Text style={styles.text}>비밀번호 확인</Text>
            <TextInput style={styles.inputBox} value={passwordCheck} onChangeText={setPasswordCheck}
                       secureTextEntry={true}/>
            <Text
                style={(passwordCheck === "") || (password === passwordCheck) ? styles.warningDisabled : styles.warning}>
                비밀번호가 일치하지 않습니다.
            </Text>
            <Text style={styles.text}>생년월일</Text>
            <TextInput style={styles.inputBox} value={birthday} onChangeText={setBirthday} keyboardType={"numeric"}/>
            <Text style={styles.text}>휴대폰번호</Text>
            <TextInput style={styles.inputBox} value={phone} onChangeText={setPhone} keyboardType={"number-pad"}/>
            <Text style={styles.text}>이메일</Text>
            <TextInput style={styles.inputBox} value={email} onChangeText={setEmail} keyboardType={"email-address"}/>

            <TouchableOpacity style={btnStatus ? styles.buttonDisabled : styles.button} onPress={() => regist()}
                              disabled={btnStatus}>
                <Text>회원가입</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: "space-between",
    },
    arrow: {
        marginTop: 8,
        width: 20,
    },
    title: {
        flexGrow: 1,
        textAlign: "center",
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
    },
    container: {
        backgroundColor: "#ffffff",
        padding: 20,
        flexGrow: 1,
        justifyContent: "center",
        // alignItems: "center",
    },
    text: {
        fontSize: 15,
        marginTop: 20,
    },
    inputBox: {
        flexDirection: 'row',
        width: width - 20 * 2,
        marginTop: 5,
        borderWidth: 1,
    },
    button: {
        marginTop: 20,
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonDisabled: {
        marginTop: 20,
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        opacity: 0.6,
    },
    warning: {
        color: "red",
        fontSize: 10,
    },
    warningDisabled: {
        display: "none",
    },
})

export default RegisterComponent;