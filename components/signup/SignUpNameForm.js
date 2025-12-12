import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform} from 'react-native';
import {useNavigation} from "@react-navigation/native";
import PageTitleComponent from "../../components/common/PageTitleComponent";
import {useUserStore} from "../../stores/UserStore";
import {CommonUtils} from "../common/CommonUtils";
import {ThemeText, ThemeView} from "../common/ThemeComponents";
import {useTheme} from "../settings/theme/ThemeContext";

const { width, height } = Dimensions.get('window');

const SignUpNameForm = () => {
  const navigation = useNavigation();
  const store = useUserStore();

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const {colors, isDark} = useTheme();

  useEffect(() => {
    CommonUtils.noGoBack();

    if(store.name) setName(store.name);
  }, []);

  const handleNext = () => {
    setError("");
    setName(name.trim());

    if(!name.trim()) {
      setError("이름을 입력해주세요.");
      setName("");
      return;
    }

    store.setter.setName(name);
    navigation.navigate("SignUpId");
  }

  return (
      <KeyboardAvoidingView style={[styles.Container, {backgroundColor: colors.background}]}
                            behavior="padding"
                            keyboardVerticalOffset={Platform.OS=== "ios" ? -10:0}
      >
        <PageTitleComponent title={"회원가입"}></PageTitleComponent>
        <ThemeView style={styles.FormContainer}>
          <ThemeView style={styles.textContainer}>
            <ThemeText style={styles.text}>
              {"이름을 입력해주세요."}
            </ThemeText>
          </ThemeView>
          <ThemeView style={styles.inputContainer}>
            <ThemeText style={styles.label}>
              {"이름"}
            </ThemeText>
            <ThemeView style={{
              color: colors.text, borderBottomWidth: 1, borderWidth: 0,
              borderColor: colors.text, height: height * 0.05, marginBottom: 15,
            }}>
              <TextInput style={[styles.inputBox, {color: colors.text, marginTop: Platform.OS === "ios" ? 15 : 0}]} value={name} placeholder={"이름"}
                         placeholderTextColor={"gray"}
                         onChangeText={(value) => {
                           setName(value);
                           setError("");
                         }}/>
            </ThemeView>
            {error ? <Text style={{ alignSelf: 'center', color: 'red' }}>{error}</Text> : null}
          </ThemeView>
          <TouchableOpacity onPress={() => {handleNext()}}>
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

export default SignUpNameForm;