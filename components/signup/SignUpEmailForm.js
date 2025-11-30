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
import {useTheme} from "../settings/theme/ThemeContext";
import {ThemeView, ThemeText} from "../common/ThemeComponents";

const {width, height} = Dimensions.get('window');

const SignUpEmailForm = () => {
    const navigation = useNavigation();
    const store = useUserStore();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const {colors, isDark} = useTheme();

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
        <KeyboardAvoidingView style={[styles.Container, {backgroundColor: colors.background}]}
                              behavior="padding"
                              keyboardVerticalOffset={Platform.OS=== "ios" ? -10:0}
        >
            <ThemeView style={styles.FormContainer}>
                <PageTitleComponent title={"회원가입"} darkMode={false} backToStack={"SignUpPw"}></PageTitleComponent>
                <ThemeView style={styles.textContainer}>
                    <ThemeText style={styles.text}>
                        {"이메일을 입력해주세요."}
                    </ThemeText>
                </ThemeView>
                <ThemeView style={styles.inputContainer}>
                    <ThemeText style={styles.label}>
                        {"이메일"}
                    </ThemeText>
                    <ThemeView style={{
                        color: colors.text, borderBottomWidth: 1, borderWidth: 0,
                        borderColor: colors.text, height: height * 0.05, marginBottom: 15,
                    }}>
                        <TextInput style={[styles.inputBox, {color: colors.text, marginTop: Platform.OS === "ios" ? 15 : 0}]} value={email} placeholder={"이메일"}
                                   placeholderTextColor={"gray"}
                                   onChangeText={(value) => {
                                       setEmail(value);
                                       setError("");
                                   }}/>
                    </ThemeView>
                    {error ? <Text style={{color: 'red'}}>{error}</Text> : null}
                </ThemeView>
                <TouchableOpacity onPress={() => {
                    handleNext()
                }}>
                    <View style={styles.btnContainer}>
                        <Text style={styles.btn}>
                            {"다음"}
                        </Text>
                    </View>
                </TouchableOpacity>
            </ThemeView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    Container: {
        flex: 1,
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
        width: width * 0.87,
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