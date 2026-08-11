import React, {useEffect} from 'react';
import {
  View,
  ImageBackground,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import {useNavigation} from "@react-navigation/native";
import {CommonUtils} from "../components/common/CommonUtils";
import { useTheme } from "../components/settings/theme/ThemeContext";
import { ThemeView, ThemeText } from "../components/common/ThemeComponents";

const {width, height} = Dimensions.get("window");

const BeforeLoginForm = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    CommonUtils.noGoBack();
    setTimeout(() => {
      navigation.replace("Login");
    }, 2000);
  }, []);

  return (
      <ThemeView style={styles.loading_FormContainer}>
        <ThemeView style={styles.loadingTitle}>
          <ThemeView style={styles.yozmin_Logo}>
            <ImageBackground style={styles.yozmin_Logo_v1}
                             source={require("../assets/Yozmin_Logo_v0.1.png")}/>
          </ThemeView>
          <ThemeView style={styles.lbMainTitle}>
            <ThemeText style={styles.mainTitle}>요즘사람</ThemeText>
          </ThemeView>
          <ThemeView style={styles.lbSubTitle}>
            <ThemeText style={styles.subTitle}>일상을 더욱 스마트하고 트렌디하게</ThemeText>
          </ThemeView>
        </ThemeView>
        {/*<TouchableOpacity onPress={() => navigation.navigate("LoginForm")}>*/}
        {/*  <View style={styles.btnFiststsrt}>*/}
        {/*    <Text style={styles.buttontext}>시작하기</Text>*/}
        {/*  </View>*/}
        {/*</TouchableOpacity>*/}
      </ThemeView>
  );
}

const styles = StyleSheet.create({
  loading_FormContainer: {
    flex: 1,
    backgroundColor: "rgba(245, 245, 245, 1)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.1,
  },
  loadingTitle: {
    width: width * 0.75,
    alignItems: "center",
  },
  yozmin_Logo: {
    height: height * 0.2,
    justifyContent: "center",
  },
  yozmin_Logo_v1: {
    width: width * 0.4,
    height: height * 0.2,
    resizeMode: "contain",
  },
  lbMainTitle: {
    marginVertical: height * 0.02,
  },
  mainTitle: {
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontSize: width * 0.09,
    fontWeight: "700",
  },
  lbSubTitle: {
    marginBottom: height * 0.03,
  },
  subTitle: {
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontSize: width * 0.05,
    fontWeight: "400",
  },
  btnFiststsrt: {
    backgroundColor: "rgba(118, 166, 255, 1)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.3,
    paddingVertical: height * 0.02,
    borderRadius: 30,
  },
  buttontext: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: width * 0.045,
    fontWeight: "700",
  }
});

export default BeforeLoginForm;