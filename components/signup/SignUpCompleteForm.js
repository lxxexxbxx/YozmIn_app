import React, {useEffect} from 'react';
import {Image, StyleSheet, Dimensions, Alert} from 'react-native';
import {useUserStore} from "../../stores/UserStore";
import supabase from "../../supabase";
import {useNavigation} from "@react-navigation/native";
import {CommonUtils} from "../common/CommonUtils";
import {useKeyStore} from "../../stores/KeyStore";
import {ThemeText, ThemeView} from "../common/ThemeComponents";

const { width, height } = Dimensions.get('window');

const SignUpCompleteForm = () => {
  const userStore = useUserStore();
  const keyStore = useKeyStore();
  const navigation = useNavigation();

  const insertUser = async () => {
    if(!userStore.name || !userStore.user_id || !userStore.password ||
        !userStore.email || !userStore.birth_date) {

      // 에러 메시지
      Alert.alert("회원가입 실패", "회원 정보가 잘못되었습니다.");

      navigation.replace("Login");
      return;
    }

    const userTableResponse = await supabase
        .from("user")
        .insert([{
          name: userStore.name,
          user_id: userStore.user_id,
          password: userStore.password,
          email: userStore.email,
          birth_date: userStore.birth_date
        }]);
    console.log(userStore);

    const mypageTableResponse = await supabase
        .from("mypage")
        .insert([{
          user_id: userStore.user_id,
        }]);

    if(userTableResponse.status === 201 && mypageTableResponse.status === 201) {
      console.log(userTableResponse.status, mypageTableResponse.status);

      const response = await supabase
      .from("user")
      .select("*", { count: "exact" })
      .eq("user_id", userStore.user_id);

      console.log(response.status);

      if (response.status === 200) {
        if (response.data.length && response.count) {
          console.log("user_id:", response.data[0].user_id);
          console.log(`login success: ${response.data[0].name}`)
          userStore.setter.setClear();
          userStore.setter.setUser(
              response.data[0].name,
              response.data[0].user_id,
              response.data[0].email,
              response.data[0].birth_date,
              response.data[0].categories,
          );

          const {data: mp} = await supabase
          .from("mypage")
          .select("mp_coin")
          .eq("user_id", userStore.user_id)
          .single();
          userStore.setter.setCoin(mp?.mp_coin ?? 0);
          keyStore.setter.setClear();
          await keyStore.setter.setKey();
        }

        navigation.replace("TabNavigator");
        // 성공 메시지
        Alert.alert("회원가입 성공", `${userStore.name}님, 환영합니다 👋`);

      }
    }
    else if(userTableResponse.status !== 201){
      console.log("등록 실패[user]:", userTableResponse.error);
      // 에러 메시지
      navigation.replace("Login");
      Alert.alert("회원가입 실패", "입력정보 확인 후 다시 시도해주세요.");
      return;
    }
    else if(mypageTableResponse.status !== 201){
      console.log("등록 실패[mypage]:", mypageTableResponse.error);
      // 에러 메시지
      navigation.replace("Login");
      Alert.alert("회원가입 실패", "입력정보 확인 후 다시 시도해주세요.");
      return;
    }
  }

  useEffect(() => {
    CommonUtils.noGoBack();
    insertUser();
  }, []);

  return (
      <ThemeView style={styles.Container}>
        <Image style={styles.clap} source={require("../../assets/clap.jpeg")}/>
        <ThemeView style={styles.label}>
          <ThemeText style={styles.text}>
            {`축하해요! \n요즘사람이 되실 준비가 끝났어요.`}
          </ThemeText>
        </ThemeView>
      </ThemeView>
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