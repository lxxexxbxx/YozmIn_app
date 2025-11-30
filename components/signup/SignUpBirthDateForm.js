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
import {ThemeView, ThemeText} from "../common/ThemeComponents";
import {useTheme} from "../settings/theme/ThemeContext";
import DropDownPicker from "react-native-dropdown-picker";

const {width, height} = Dimensions.get('window');

// year 리스트
const getYears = () => {
    const todayYear = new Date().getFullYear();
    const items = [];
    for(let i=todayYear; i>=2010; i--) {
        items.push({ label: `${i}년`, value: i });
    }
    return items
}
// month 리스트
const getMonths = () => {
    const todayMonth = new Date().getMonth();
    const items = [];
    for(let i=todayMonth; i>=0; i--) {
        items.push({ label: `${i+1}월`, value: i+1 });
    }
    return items
}
// day 리스트
const getDays = () => {
    const todayDate = new Date().getDate();
    const items = [];
    for(let i=todayDate; i>=0; i--) {
        items.push({ label: `${i}일`, value: i });
    }
    return items
}

const SignUpBirthDateForm = () => {
    const navigation = useNavigation();
    const store = useUserStore();
    const {colors, isDark} = useTheme();

    const [openY, setOpenY] = useState(false);
    const [openM, setOpenM] = useState(false);
    const [openD, setOpenD] = useState(false);

    const [year , setYear] = useState(new Date().getFullYear());
    const [years , setYears] = useState(getYears);
    const [month , setMonth] = useState(new Date().getMonth() + 1);
    const [months , setMonths] = useState(getMonths);
    const [day, setDay] = useState(new Date().getDate());
    const [days, setDays] = useState(getDays);

    useEffect(() => {
        CommonUtils.noGoBack();

        if (store.birth_date) {
            const date = store.birth_date.split("-");
            console.log(date);
            setYear(date[0]);
            setMonth(date[1]);
            setDay(date[2]);
        }
    }, []);

    const handleNext = () => {
        console.log(new Date(store.birth_date));
        setYear(year);
        setMonth(month);
        setDay(day);

        const birthDate = year + "-" + month + "-" + day;

        store.setter.setBirthDate(birthDate);
        navigation.replace("SignUpComplete");
    }

    // 드롭다운이 겹치지 않도록 onOpen 시 서로 닫기
    const onYearOpen = () => {
        setOpenM(false);
        setOpenD(false);
    };
    const onMonthOpen = () => {
        setOpenY(false);
        setOpenD(false);
    };
    const onDayOpen = () => {
        setOpenY(false);
        setOpenM(false);
    };

    return (
        <KeyboardAvoidingView style={[styles.Container, {backgroundColor: colors.background}]}
                              behavior="padding"
                              keyboardVerticalOffset={Platform.OS === "ios" ? -10 : 0}
        >
            <ThemeView style={styles.FormContainer}>
                <PageTitleComponent title={"회원가입"} darkMode={false} backToStack={"SignUpEmail"}></PageTitleComponent>
                <ThemeView style={styles.textContainer}>
                    <ThemeText style={styles.text}>
                        {"생년월일을 입력해주세요."}
                    </ThemeText>
                </ThemeView>
                <ThemeView style={styles.inputContainer}>
                    <ThemeText style={styles.label}>
                        {"생년월일"}
                    </ThemeText>
                    <ThemeView style={styles.filterRow}>
                        <ThemeView style={{ zIndex: 3000, elevation: 3000 }}>
                            <DropDownPicker
                                open={openY}
                                value={year}
                                items={years}
                                setOpen={setOpenY}
                                setValue={setYear}
                                setItems={setYears}
                                onOpen={onYearOpen}
                                placeholder="연도 선택"
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                listMode={"SCROLLVIEW"}
                                scrollViewProps={{ nestedScrollEnabled: true }}
                                zIndex={3000}
                                zIndexInverse={1000}
                            />
                        </ThemeView>
                        <ThemeView style={{ zIndex: 3000, elevation: 3000 }}>
                            <DropDownPicker
                                open={openM}
                                value={month}
                                items={months}
                                setOpen={setOpenM}
                                setValue={setMonth}
                                setItems={setMonths}
                                onOpen={onMonthOpen}
                                placeholder="월 선택"
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                listMode={"SCROLLVIEW"}
                                scrollViewProps={{ nestedScrollEnabled: true }}
                                zIndex={3000}
                                zIndexInverse={1000}
                            />
                        </ThemeView>
                        <ThemeView style={{ zIndex: 3000, elevation: 3000 }}>
                            <DropDownPicker
                                open={openD}
                                value={day}
                                items={days}
                                setOpen={setOpenD}
                                setValue={setDay}
                                setItems={setDays}
                                onOpen={onDayOpen}
                                placeholder="일 선택"
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                listMode={"SCROLLVIEW"}
                                scrollViewProps={{ nestedScrollEnabled: true }}
                                zIndex={3000}
                                zIndexInverse={1000}
                            />
                        </ThemeView>
                    </ThemeView>
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
        width: width * 0.2,
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
    // 상단 필터 바
    filterBar: {
        justifyContent: "center",
        paddingHorizontal: 12,
        zIndex: 4000,
        elevation: 4000,
    },
    filterRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
        gap: 8,
    },
    dropdown: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        minWidth: 100,
        minHeight: 40,
        backgroundColor: "rgba(255,255,255,0.95)",
    },
    dropdownContainer: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        maxWidth: 250,
        maxHeight: 250,
    },
});

export default SignUpBirthDateForm;