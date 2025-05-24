import React, {useEffect} from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import {useUserStore} from "../../stores/UserStore";
import supabase from "../../supabase";
import {useNavigation} from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {CommonUtils} from "../common/CommonUtils";

const { width, height } = Dimensions.get('window');

const SignUpCompleteForm = () => {
  const store = useUserStore();
  const navigation = useNavigation();

  const insertUser = async () => {
    if(!store.name || !store.user_id || !store.password ||
        !store.email || !store.birth_date) {

      // 에러 메시지
      Toast.show({
        type: 'error',
        text1: '회원가입 실패',
        text2: '회원 정보가 잘못되었습니다.',
      });

      return;
    }

    const response = await supabase
    .from("user")
    .insert([{
      name: store.name,
      user_id: store.user_id,
      password: store.password,
      email: store.email,
      birth_date: store.birth_date
    }]);

    if(response.status === 201) {
      console.log("등록 성공");
      // 성공 메시지
      Toast.show({
        type: 'success',
        text1: '회원가입 완료',
        text2: `${store.name}님, 환영합니다 👋`,
      });
    }
    else console.log("등록 실패:", response.error);
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
      <View style={styles.joinGroup06_FormContainer}>
        <View style={styles.lbl1}>
          <Text style={styles.finishGroupJoin}>
            {`축하해요! \n요즘사람이 되실 준비가 끝났어요.`}
          </Text>
        </View>
        <ImageBackground style={styles.icClap} source={require("../../assets/clap.jpeg")}/>
      </View>
  );
}

const styles = StyleSheet.create({
  joinGroup06_FormContainer: {
    position: "relative",
    flexShrink: 0,
    borderStyle: "solid",
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 1)"
  },
  lbl1: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.29, // 화면 높이에 비례
    bottom: height * 0.61, // 화면 높이에 비례
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: width * 0.025, // 화면 너비에 비례
    paddingHorizontal: width * 0.12, // 화면 너비에 비례
    paddingVertical: height * 0.02 // 화면 높이에 비례
  },
  finishGroupJoin: {
    position: "relative",
    flexShrink: 0,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Share",
    fontSize: width * 0.06, // 화면 너비에 비례
    fontWeight: 700
  },
  icClap: {
    position: "absolute",
    flexShrink: 0,
    top: height * 0.23, // 화면 높이에 비례
    left: width * 0.65, // 화면 너비에 비례
    width: width * 0.18, // 화면 너비에 비례
    height: width * 0.18, // 화면 너비에 비례 (정사각형 유지)
    transform: [{ rotateZ: "10.33deg" }]
  }
});

export default SignUpCompleteForm;