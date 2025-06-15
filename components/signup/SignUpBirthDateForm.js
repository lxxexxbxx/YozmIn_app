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
import {useNavigation} from "@react-navigation/native";
import PageTitleComponent from "../../components/common/PageTitleComponent";
import {useUserStore} from "../../stores/UserStore";
import {CommonUtils} from "../common/CommonUtils";

const {width, height} = Dimensions.get('window');

const SignUpBirthDateForm = () => {
    const navigation = useNavigation();
    const store = useUserStore();

    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        CommonUtils.noGoBack();

        if (store.birth_date) {
            const date = store.birth_date.split("-");
            console.log(date);
            // setYear(date[0]);
            // setMonth(date[1]);
            // setDay(date[2]);
        }
    }, []);

    const handleNext = () => {
        console.log(new Date(store.birth_date));
        setError("");
        setYear(year.trim());
        setMonth(month.trim());
        setDay(day.trim());

        if (!year.trim()) {
            setError("연도를 입력해주세요.");
            setYear("");
            return;
        }
        if (!month.trim()) {
            setError("월을 입력해주세요.");
            setMonth("");
            return;
        }
        if (!day.trim()) {
            setError("일을 입력해주세요.");
            setDay("");
            return;
        }

        const birthDate = year + "-" + month + "-" + day;

        store.setter.setBirthDate(birthDate);
        navigation.replace("SignUpComplete");
    }

    return (
        <KeyboardAvoidingView style={styles.Container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.FormContainer}>
                <PageTitleComponent title={"회원가입"} darkMode={false} backToStack={"SignUpEmail"}></PageTitleComponent>
                <View style={styles.textContainer}>
                    <Text style={styles.text}>
                        {"생년월일을 입력해주세요."}
                    </Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        {"생년월일"}
                    </Text>
                    <View style={{flexDirection: "row"}}>
                        <TextInput style={styles.inputBox} value={year} placeholder={"년"}
                                   inputMode={"numeric"} maxLength={4}
                                   onChangeText={(value) => {
                                       setYear(value);
                                       setError("");
                                   }}/>/>
                        <Text style={styles.dash}> - </Text>
                        <TextInput style={styles.inputBox} value={month} placeholder={"월"}
                                   inputMode={"numeric"} maxLength={2}
                                   onChangeText={(value) => {
                                       setMonth(value);
                                       setError("");
                                   }}/>/>
                        <Text style={styles.dash}> - </Text>
                        <TextInput style={styles.inputBox} value={day} placeholder={"일"}
                                   inputMode={"numeric"} maxLength={2}
                                   onChangeText={(value) => {
                                       setDay(value);
                                       setError("");
                                   }}/>/>
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
        width: width * 0.2,
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
    },
    dash: {
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        fontSize: width * 0.1,
    }
});

export default SignUpBirthDateForm;