import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    TextInput,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import {Svg, Path, Circle} from 'react-native-svg';
import {useNavigation} from "@react-navigation/native";
import PageTitleComponent from "../../components/common/PageTitleComponent";
import {useUserStore} from "../../stores/UserStore";
import {CommonUtils} from "../common/CommonUtils";

const {width, height} = Dimensions.get('window');

const SignUpEmailForm = () => {
    const navigation = useNavigation();
    const store = useUserStore();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        CommonUtils.noGoBack();

        if (store.email) setEmail(store.email);
    }, []);

    const handleNext = () => {
        setError("");
        setEmail(email.trim());

        if (!email.trim()) {
            setError("이메일을 입력해주세요.");
            setEmail("");
            return;
        }
        if (!emailRegex.test(email)) {
            setError("이메일 형식이 올바르지 않습니다.");
            return;
        }

        store.setter.setEmail(email);
        navigation.replace("SignUpBirthDate");
    }

    return (
        <KeyboardAvoidingView style={styles.Container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.FormContainer}>
                <PageTitleComponent title={"회원가입"} darkMode={false} backToStack={"SignUpPw"}></PageTitleComponent>
                <View style={styles.textContainer}>
                    <Text style={styles.text}>
                        {"이메일을 입력해주세요."}
                    </Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        {"이메일"}
                    </Text>
                    <View style={{flexDirection: "row"}}>
                        <TextInput style={styles.inputBox} value={email} placeholder={"이메일"}
                                   onChangeText={(value) => {
                                       setEmail(value);
                                       setError("");
                                   }}/>
                        <TouchableOpacity
                            style={{flex: 1, marginBottom: 15, justifyContent: "center", alignItems: "center"}}
                            onPress={() => setEmail("")}>
                            <Svg width="20" height="21" viewBox="0 0 20 21" fill="none">
                                <Circle cx="10" cy="10.5" r="10" fill="#C7C7C7"/>
                                <Path d="M5.80005 6.30005L14.3 14.8" stroke="white" strokeWidth="2"/>
                                <Path d="M5.80005 14.8L14.3 6.30005" stroke="white" strokeWidth="2"/>
                            </Svg>
                        </TouchableOpacity>
                    </View>
                    {error ? <Text style={{color: 'red'}}>{error}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => {
                    handleNext()
                }}>
                    <View style={styles.btnContainer}>
                        <Text style={styles.btn}>
                            {"다음"}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: "white"
    },
    FormContainer: {
        backgroundColor: "rgba(255, 255, 255, 1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    textContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: height * 0.04,
        marginBottom: height * 0.05
    },
    text: {
        position: "absolute",
        flexShrink: 0,
        textAlign: "center",
        color: "rgba(0, 0, 0, 1)",
        fontFamily: "Share",
        fontSize: width * 0.07,
        fontWeight: 700,
    },
    inputContainer: {
        display: "flex",
        flexDirection: "column",
    },
    label: {
        textAlign: "left",
        fontFamily: "Kanit",
        fontSize: width * 0.04,
        fontWeight: 700,
    },
    inputBox: {
        width: width * 0.8,
        marginBottom: height * 0.01,
        borderBottomWidth: 1,
    },
    btnContainer: {
        marginTop: height * 0.1,
        height: height * 0.073,
        width: width * 0.78,
        backgroundColor: "rgba(118, 166, 255, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        rowGap: height * 0.012,
        paddingHorizontal: width * 0.10,
        paddingVertical: height * 0.018,
        borderRadius: 30,
    },
    btn: {
        textAlign: "center",
        color: "rgba(255, 255, 255, 1)",
        fontFamily: "Share",
        fontSize: width * 0.05,
    }
});

export default SignUpEmailForm;