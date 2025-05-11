import {useNavigation} from "@react-navigation/native";

LoginForm

import React, {use, useState} from 'react';
import {
  View,
  ImageBackground,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity, TextInput
} from 'react-native';
import { Svg, Path, Line } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function LoginForm() {
  const navigation = useNavigation();

  const [eye, setEye] = useState(false);
  const [eyeImg, setEyeImg] = useState(require("../assets/eye_opened.jpeg"));

  const eyeChange = () => {
    setEye(!eye);
    setEyeImg(!eye ? require("../assets/eye_opened.jpeg") : require("../assets/eye_closed.jpeg"));
  }

  return (
      <View style={styles.login_FormContainer}>
        <View style={styles.login_Title}>
          <View style={styles.login_Logo}>
            <ImageBackground style={styles.yozmin_Logo_v011} source={require("../assets/main_logo.jpeg")}/>
            <Text style={styles.lbLogin}>
              {`로그인`}
            </Text>
          </View>
        </View>
        <View style={styles.tbID}>
          <View style={styles.iDIcon}>
            <Svg style={styles.Idicon} width="20" height="21" viewBox="0 0 20 21" fill="none" >
              <Path d="M10 10.5C12.7625 10.5 15 8.2625 15 5.5C15 2.7375 12.7625 0.5 10 0.5C7.2375 0.5 5 2.7375 5 5.5C5 8.2625 7.2375 10.5 10 10.5ZM10 13C6.6625 13 0 14.675 0 18V20.5H20V18C20 14.675 13.3375 13 10 13Z" fill="black"/>
            </Svg>
          </View>
          <TextInput style={styles.lbInputID}>
            {`아이디를 입력해주세요.`}
          </TextInput>
        </View>
        <View style={styles.tbPW}>
          <View style={styles.pwIcon}>
            <Svg style={styles._pwIcon} width="20" height="23" viewBox="0 0 20 23" fill="none" >
              <Path d="M17.5 7.83333H16.25V5.7381C16.25 2.84667 13.45 0.5 10 0.5C6.55 0.5 3.75 2.84667 3.75 5.7381V7.83333H2.5C1.125 7.83333 0 8.77619 0 9.92857V20.4048C0 21.5571 1.125 22.5 2.5 22.5H17.5C18.875 22.5 20 21.5571 20 20.4048V9.92857C20 8.77619 18.875 7.83333 17.5 7.83333ZM10 17.2619C8.625 17.2619 7.5 16.319 7.5 15.1667C7.5 14.0143 8.625 13.0714 10 13.0714C11.375 13.0714 12.5 14.0143 12.5 15.1667C12.5 16.319 11.375 17.2619 10 17.2619ZM13.875 7.83333H6.125V5.7381C6.125 3.94667 7.8625 2.49048 10 2.49048C12.1375 2.49048 13.875 3.94667 13.875 5.7381V7.83333Z" fill="black"/>
            </Svg>
          </View>
          <TextInput style={styles._lbInputID}>
            {`비밀번호를 입력해주세요.`}
          </TextInput>
          {/* Visualwind:: can be replaced with <Hide hide={"false"} /> */}
          <TouchableOpacity onPress={() => eyeChange()}>
            <View style={styles.hide}>
              <ImageBackground style={styles._hide} source={eyeImg}/>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.fIDSave}>
          {/* Visualwind:: can be replaced with <ChIdSave check={"false"} /> */}
          <View style={styles.chIdSave}>
            <View style={styles.rectangle67}/>
          </View>
          <Text style={styles.lbchIdSave}>
            {`아이디 저장`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <View style={styles.btnLogin}>
            <Text style={styles._lbLogin}>
              {`로그인`}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.fFindAndJoin}>
          <View style={styles.btnFindID}>
            <Text style={styles.lbFindId}>
              {`아이디 찾기`}
            </Text>
          </View>
          <View style={styles.btnFindPW}>
            <Text style={styles.lbFindPw}>
              {`비밀번호 찾기`}
            </Text>
          </View>
          <View style={styles.null}/>
          <View style={styles.btnJoin}>
            <Text style={styles.lbJoin}>
              {`회원가입`}
            </Text>
          </View>
        </View>
        <View style={styles.simple_Login_Bar}>
          <Text style={styles.lbSimpleLogin}>
            {`간편로그인`}
          </Text>
          <Svg style={styles.line1} width="131" height="2" viewBox="0 0 131 2" fill="none" >
            <Line x1="0.5" y1="1" x2="130.5" y2="1" stroke="black"/>
          </Svg>

          <Svg style={styles.line2} width="131" height="2" viewBox="0 0 131 2" fill="none" >
            <Line x1="0.5" y1="1" x2="130.5" y2="1" stroke="black"/>
          </Svg>

        </View>
        <View style={styles.btnGoogleStart}>
          <ImageBackground style={styles.google_Logo} source={require("../assets/google_login.jpeg")}/>
          <Text style={styles.lbGoogleStart}>
            {`구글로 시작하기`}
          </Text>
        </View>
        <View style={styles.btnKakaoStart}>
          <ImageBackground style={styles.kakao_Logo} source={require("../assets/kakao_login.jpeg")}/>
          <Text style={styles.lbKakaoStart}>
            {`카카오로 시작하기`}
          </Text>
        </View>
      </View>
  )
}

const styles = StyleSheet.create({
  login_FormContainer: {
    position: "relative",
    flexShrink: 0,
    paddingTop: height * 0.11,
    paddingBottom: height * 0.13,
    backgroundColor: "rgba(245, 245, 245, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.016,
    paddingHorizontal: width * 0.05,
  },
  login_Title: {
    position: "relative",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: width * 0.025,
  },
  login_Logo: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.19,
    width: width * 0.41,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
  },
  _login_Logo: {
    position: "absolute",
    flexShrink: 0,
    height: height * 0.19,
    width: width * 0.41,
  },
  yozmin_Logo_v011: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.41,
    height: height * 0.19,
  },
  lbLogin: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.14,
    left: width * 0.10,
    width: width * 0.20,
    height: height * 0.037,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Share",
    fontSize: width * 0.07,
    fontWeight: 700,
  },
  tbID: {
    position: "relative",
    flexShrink: 0,
    width: width * 0.83,
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    alignItems: "center",
    columnGap: width * 0.05,
    paddingHorizontal: width * 0.025,
    paddingVertical: 0,
  },
  iDIcon: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.024,
    width: width * 0.05,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  _iDIcon: {
    position: "absolute",
    flexShrink: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "visible",
  },
  lbInputID: {
    position: "relative",
    flexShrink: 0,
    width: width * 0.65,
    height: height * 0.05,
    textAlign: "left",
    color: "rgba(102, 102, 102, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.025,
    fontWeight: 300,
  },
  tbPW: {
    position: "relative",
    flexShrink: 0,
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    alignItems: "center",
    columnGap: width * 0.05,
    paddingHorizontal: width * 0.022,
    paddingVertical: 0,
  },
  pwIcon: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.026,
    width: width * 0.05,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  _pwIcon: {
    position: "absolute",
    flexShrink: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "visible",
  },
  _lbInputID: {
    position: "relative",
    flexShrink: 0,
    width: width * 0.56,
    height: height * 0.05,
    textAlign: "left",
    color: "rgba(102, 102, 102, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.025,
    fontWeight: 300,
  },
  hide: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.028,
    width: width * 0.06,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  _hide: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.06,
    height: height * 0.028,
  },
  fIDSave: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.019,
    width: width * 0.83,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  chIdSave: {
    position: "absolute",
    flexShrink: 0,
    height: height * 0.019,
    left: width * 0.015,
    width: width * 0.04,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  rectangle67: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.04,
    height: height * 0.019,
    backgroundColor: "rgba(217, 217, 217, 1)",
    borderRadius: 2,
  },
  lbchIdSave: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.0035,
    left: width * 0.06,
    width: width * 0.16,
    height: height * 0.012,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.025,
    fontWeight: 600,
  },
  btnLogin: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.058,
    width: width * 0.77,
    backgroundColor: "rgba(118, 166, 255, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: width * 0.025,
    padding: width * 0.025,
    borderRadius: 30,
  },
  _lbLogin: {
    position: "relative",
    flexShrink: 0,
    textAlign: "center",
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Share",
    fontSize: width * 0.045,
    fontWeight: 700,
  },
  fFindAndJoin: {
    position: "relative",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 0,
  },
  btnFindID: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.017,
    width: width * 0.16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
  },
  lbFindId: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.12,
    height: height * 0.017,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.025,
    fontWeight: 600,
  },
  btnFindPW: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.017,
    width: width * 0.16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
  },
  lbFindPw: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.145,
    height: height * 0.017,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.025,
    fontWeight: 600,
  },
  null: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.017,
    width: width * 0.32,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
  },
  btnJoin: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.017,
    width: width * 0.09,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
  },
  lbJoin: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.09,
    height: height * 0.017,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.025,
    fontWeight: 600,
  },
  simple_Login_Bar: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.028,
    width: width * 0.89,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: height * 0.012,
  },
  simple_Login: {
    position: "absolute",
    flexShrink: 0,
    height: height * 0.028,
    width: width * 0.89,
  },
  lbSimpleLogin: {
    position: "absolute",
    flexShrink: 0,
    left: width * 0.35,
    width: width * 0.18,
    height: height * 0.028,
    textAlign: "center",
    color: "rgba(102, 102, 102, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.04,
    fontWeight: 700,
  },
  line1: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.015,
    left: width * 0.55,
    width: width * 0.33,
    minHeight: 0.001,
    overflow: "visible",
  },
  line2: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.015,
    width: width * 0.33,
    minHeight: 0.001,
    overflow: "visible",
  },
  btnGoogleStart: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.052,
    width: width * 0.74,
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: height * 0.039,
    paddingHorizontal: width * 0.037,
    paddingVertical: height * 0.007,
    borderRadius: 20,
  },
  google_Logo: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.008,
    left: width * 0.038,
    width: width * 0.076,
    height: height * 0.034,
  },
  lbGoogleStart: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.009,
    left: width * 0.20,
    width: width * 0.34,
    height: height * 0.034,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.04,
    fontWeight: 700,
  },
  btnKakaoStart: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.052,
    width: width * 0.74,
    backgroundColor: "rgba(255, 235, 59, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: height * 0.040,
    paddingHorizontal: width * 0.037,
    paddingVertical: height * 0.007,
    borderRadius: 20,
  },
  kakao_Logo: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.008,
    left: width * 0.038,
    width: width * 0.076,
    height: height * 0.034,
  },
  lbKakaoStart: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.009,
    // height: height * 0.034,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Kanit",
    fontSize: width * 0.04,
    fontWeight: 700,
  }
});
