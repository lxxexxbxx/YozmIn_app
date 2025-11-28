import React, {useEffect} from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import {useUserStore} from "../../stores/UserStore";
import supabase from "../../supabase";
import {useNavigation} from "@react-navigation/native";
import {CommonUtils} from "../common/CommonUtils";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const { width, height } = Dimensions.get('window');

const SignUpCompleteForm = () => {
  const store = useUserStore();
  const navigation = useNavigation();

  const insertUser = async () => {
    if(!store.name || !store.user_id || !store.password ||
        !store.email || !store.birth_date) {

      // 에러 메시지
      // Toast.show({
      //   type: 'error',
      //   text1: '회원가입 실패',
      //   text2: '회원 정보가 잘못되었습니다.',
      // });
      console.log("회원가입 실패: 회원 정보가 잘못되었습니다.")

      navigation.navigate("Login");
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
      // Toast.show({
      //   type: 'success',
      //   text1: '회원가입 완료',
      //   text2: `${store.name}님, 환영합니다 👋`,
      // });
      console.log(`회원가입 완료: ${store.name}님, 환영합니다 👋`);
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
      <View style={styles.Container}>
        <ImageBackground style={styles.clap} source={require("../../assets/clap.jpeg")}/>
        <View style={styles.label}>
          <Text style={styles.text}>
            {`축하해요! \n요즘사람이 되실 준비가 끝났어요.`}
          </Text>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  Container: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Share",
    fontSize: width * 0.06, // 화면 너비에 비례
  },
  clap: {
    flex:1,
    position: "absolute",
    flexShrink: 0,
    top: height * 0.30, // 화면 높이에 비례
    left: width * 0.65, // 화면 너비에 비례
    width: width * 0.18, // 화면 너비에 비례
    height: width * 0.18, // 화면 너비에 비례 (정사각형 유지)
    transform: [{ rotateZ: "10.33deg" }]
  }
});

export default SignUpCompleteForm;