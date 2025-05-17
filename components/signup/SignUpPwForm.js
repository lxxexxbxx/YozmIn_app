import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Image
} from 'react-native';
import {useNavigation} from "@react-navigation/native";
import PageTitleComponent from "../../components/common/PageTitleComponent";
import {useUserStore} from "../../stores/UserStore";
import {CommonUtils} from "../common/CommonUtils";

const {width, height} = Dimensions.get('window');

const SignUpPwForm = () => {
  const navigation = useNavigation();
  const store = useUserStore();

  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [pwHide, setPwHide] = useState(true);
  const [pwCheckHide, setPwCheckHide] = useState(true);
  const [pwError, setPwError] = useState("");
  const [pwCheckError, setPwCheckError] = useState("");

  const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).{8,20}$/;

  useEffect(() => {
    CommonUtils.noGoBack();
  }, []);

  const handleNext = () => {
    setPwError("");
    setPwCheckError("");
    setPw(pw.trim());
    setPwCheck(pwCheck.trim());

    if (!pw) {
      setPwError("비밀번호를 입력해주세요.");
      setPw("");
      return;
    }
    if (!pwCheck) {
      setPwCheckError("비밀번호 확인을 입력해주세요.");
      setPwCheck("");
      return;
    }
    if(!pwRegex.test(pw)) {
      setPwError("비밀번호는 영문, 숫자, 특수문자 포함\n8~20자 이내여야 합니다.");
      return;
    }
    if (pw !== pwCheck) {
      setPwCheckError("비밀번호가 일치하지 않습니다.");
      return;
    }

    store.setter.setPw(pwCheck);
    navigation.replace("SignUpEmail");
  }

  return (
      <View style={styles.FormContainer}>
        <PageTitleComponent title={"회원가입"} darkMode={false} backToStack={"SignUpId"}></PageTitleComponent>
        <View style={styles.fNull1}/>
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {"비밀번호를 입력해주세요."}
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {"비밀번호"}
          </Text>
          <View style={{flexDirection: "row"}}>
            <TextInput style={styles.inputBox} value={pw}
                       placeholder={"비밀번호"} secureTextEntry={pwHide}
                       onChangeText={(value) => {
                         setPw(value);
                         setPwError("");
                       }}/>
            <TouchableOpacity style={styles.cancelBtn}
                              onPress={() => setPwHide(!pwHide)}>
              {!pwHide ? <Image
                  source={require("../../assets/eye_opened.jpeg")}/> : <Image
                  source={require("../../assets/eye_closed.jpeg")}/>}
            </TouchableOpacity>
          </View>
          {pwError ? <Text style={{color: 'red'}}>{pwError}</Text> : null}
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {"비밀번호 확인"}
          </Text>
          <View style={{flexDirection: "row"}}>
            <TextInput style={styles.inputBox} value={pwCheck}
                       placeholder={"비밀번호 확인"} secureTextEntry={pwCheckHide}
                       onChangeText={(value) => {
                         setPwCheck(value);
                         setPwCheckError("");
                       }}/>
            <TouchableOpacity style={styles.cancelBtn}
                              onPress={() => setPwCheckHide(!pwCheckHide)}>
              {!pwCheckHide ? <Image
                  source={require("../../assets/eye_opened.jpeg")}/> : <Image
                  source={require("../../assets/eye_closed.jpeg")}/>}
            </TouchableOpacity>
          </View>
          {pwCheckError ? <Text style={{color: 'red'}}>{pwCheckError}</Text> : null}
        </View>
        <View style={styles.fNull2}/>
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
)
}

const styles = StyleSheet.create({
  FormContainer: {
    position: "relative",
    flexShrink: 0,
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    rowGap: 0,
  }
,
  fNull1: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.075,
    width: width * 0.87,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  }
,
  textContainer: {
    position: "relative",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
    paddingVertical: height * 0.04,
  }
,
  text: {
    position: "absolute",
    flexShrink: 0,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Share",
    fontSize: width * 0.07,
    fontWeight: 700,
  }
,
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  }
,
  lbName: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  }
,
  label: {
    textAlign: "left",
    fontFamily: "Kanit",
    fontSize: width * 0.04,
    fontWeight: 700,
  }
,
  inputBox: {
    width: width * 0.72,
    marginBottom: 20,
    borderBottomWidth: 1,
  }
,
  fNull2: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.225,
    width: width * 0.98,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
    paddingHorizontal: width * 0.18,
    paddingVertical: height * 0.018,
  }
,
  btnContainer: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.073,
    width: width * 0.78,
    backgroundColor: "rgba(118, 166, 255, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
    paddingHorizontal: width * 0.10,
    paddingVertical: height * 0.018,
    borderRadius: 30,
  }
,
  btn: {
    position: "absolute",
    textAlign: "center",
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Share",
    fontSize: width * 0.07,
    fontWeight: 400,
  }
});

export default SignUpPwForm;