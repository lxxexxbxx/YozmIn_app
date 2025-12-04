import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageBackground
} from "react-native";
import React, { useEffect, useState } from "react";
import KakaoLoginComponent from "./KakaoLoginComponent";
import { useNavigation } from "@react-navigation/native";
import { CommonUtils } from "../common/CommonUtils";
import supabase from "../../supabase";
import SHA256 from "crypto-js/sha256";
import { useUserStore } from "../../stores/UserStore";
import { useKeyStore } from "../../stores/KeyStore";
import { useTheme } from "../settings/theme/ThemeContext";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import GoogleLoginComponent from "./GoogleLoginComponent";

const { width, height } = Dimensions.get("window");

const LoginComponent = () => {
  const navigation = useNavigation();
  const userStore = useUserStore();
  const keyStore = useKeyStore();
  const { colors, isDark } = useTheme();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const [idError, setIdError] = useState("");
  const [pwError, setPwError] = useState("");

  const [pwHide, setPwHide] = useState(true);

  useEffect(() => {
    CommonUtils.noGoBack();
  });

  const login = async () => {
    setIdError("");
    setPwError("");
    setId(id.trim());
    setPw(pw.trim());

    if (!id) {
      setIdError("아이디를 입력해주세요.");
      return;
    }
    if (!pw) {
      setPwError("비밀번호를 입력해주세요.");
      return;
    }

    const hashedPw = SHA256(pw).toString();

    const response = await supabase
      .from("user")
      .select("*", { count: "exact" })
      .eq("user_id", `${id}`);

    if (response.status === 200) {
      if (response.data.length && response.count) {
        if (response.data[0].password === hashedPw) {
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

          const { data: mp } = await supabase
            .from("mypage")
            .select("mp_coin")
            .eq("user_id", response.data[0].user_id)
            .single();
          userStore.setter.setCoin(mp?.mp_coin ?? 0);
          keyStore.setter.setClear();
          await keyStore.setter.setKey();

          if (useKeyStore.getState().GOOGLE_API_KEY) {
            navigation.replace("TabNavigator");
          } else {
            console.warn("⚠️ 키 로드 실패");
          }
          // navigation.replace("TabNavigator")
        } else {
          setPwError("비밀번호가 다릅니다.\n다시 입력해주세요.");
          return;
        }
      }
    } else {
      console.log("조회 실패:", response.error);
    }

    setPwError("아이디 또는 비밀번호가 다릅니다.");
  }

  return (
    <ThemeView style={styles.container}>
      <ImageBackground style={styles.yozmin_Logo_v1}
        source={require("../../assets/Yozmin_Logo_v0.1.png")} />
      <ThemeView style={styles.inputContainer}>
        <ThemeView style={{ flexDirection: "row" }}>
          <ThemeView style={{
            color: colors.text, borderBottomWidth: 1, borderWidth: 0,
            borderColor: colors.text, height: height * 0.05, marginBottom: 15,
          }}>
            <TextInput style={{
              width: width - 60,
              marginBottom: 20,
              height: height * 0.05,
              color: colors.text,
            }}
              value={id}
              placeholder={"아이디"}
              placeholderTextColor={"gray"}
              onChangeText={(value) => {
                setId(value);
                setIdError("");
              }} />
          </ThemeView>
        </ThemeView>
        {idError ? <Text style={{ color: 'red' }}>{idError}</Text> : null}
        <ThemeView style={{ flexDirection: "row" }}>
          <ThemeView style={{ alignSelf: 'center' }}>
            <ThemeView style={{
              color: colors.text, borderBottomWidth: 1, borderWidth: 0,
              borderColor: colors.text, height: height * 0.05
            }}>
              <TextInput style={{
                width: width - 85,
                marginBottom: 20,
                height: height * 0.05,
                color: colors.text
              }}
                value={pw}
                placeholder={"비밀번호"} secureTextEntry={pwHide}
                placeholderTextColor={"gray"}
                onChangeText={(value) => {
                  setPw(value);
                  setPwError("");
                }} />
            </ThemeView>
          </ThemeView>
          <TouchableOpacity onPress={() => setPwHide(!pwHide)}
            activeOpacity={1}
            style={{
              color: colors.text,
              borderBottomWidth: 1,
              borderWidth: 0,
              borderColor: colors.text,
              height: height * 0.05,
              width: width * 0.07
            }}>
            {!pwHide ? <ImageBackground style={styles.pwEye}
              resizeMode={"contain"}
              source={require("../../assets/eye_opened.png")} /> :
              <Image style={styles.pwEye}
                resizeMode={"contain"}
                source={require("../../assets/eye_closed.png")} />}
          </TouchableOpacity>
        </ThemeView>
        {pwError ? <Text style={{ color: 'red' }}>{pwError}</Text> : null}
      </ThemeView>
      <TouchableOpacity style={{ alignSelf: 'center', marginBottom: 15 }}
        onPress={() => login()}>
        <View style={styles.btnContainer}>
          <Text style={styles.btn}>{"로그인"}</Text>
        </View>
      </TouchableOpacity>
      <ThemeView style={{
        flexDirection: 'row',
        alignSelf: 'center',
        marginBottom: 20
      }}>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <ThemeText>아이디찾기</ThemeText>
        </TouchableOpacity>
        <ThemeText>{" | "}</ThemeText>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <ThemeText>비밀번호찾기</ThemeText>
        </TouchableOpacity>
        <ThemeText>{" | "}</ThemeText>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <ThemeText>회원가입</ThemeText>
        </TouchableOpacity>
      </ThemeView>
      <ThemeView style={styles.dividerContainer}>
        <ThemeView style={{ flex: 1, height: 1, backgroundColor: colors.text }} />
        <ThemeText style={styles.exText}>간편로그인</ThemeText>
        <ThemeView style={{ flex: 1, height: 1, backgroundColor: colors.text }} />
      </ThemeView>
      <GoogleLoginComponent />
      <KakaoLoginComponent />
    </ThemeView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    padding: 10,
    textAlign: "center",
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
  },
  text: {
    textAlign: "center",
    fontSize: 10,
  },
  inputContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  inputBox: {
    width: width - 80,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  button: {
    backgroundColor: '#ffa500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  yozmin_Logo_v1: {
    width: width * 0.4,
    height: height * 0.2,
    resizeMode: "contain",
    alignSelf: "center",
  },
  btnContainer: {
    height: height * 0.073,
    width: width * 0.78,
    backgroundColor: "rgba(118, 166, 255, 1)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  btn: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Share",
    fontSize: width * 0.05,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  exText: {
    fontSize: height * 0.017,
    marginHorizontal: 5,
    fontWeight: "600",
  },
  pwEye: {
    height: height * 0.04,
    width: width * 0.08,
    marginTop: 0,
  }
})

export default LoginComponent;