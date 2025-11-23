import React, {useEffect} from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import {useNavigation} from "@react-navigation/native";
import {CommonUtils} from "../components/common/CommonUtils";
import { useTheme } from "../components/settings/theme/ThemeContext";
import { ThemeView, ThemeText } from "../components/common/ThemeComponents";

const { width, height } = Dimensions.get('window');

export default function StartForm() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // CommonUtils.noGoBack();
  }, []);

  return (
      <ThemeView style={styles.start_FormContainer}>
        <ThemeView style={styles.startTitle}>
          <ThemeText style={styles.lbStartTitle}>
            {`요즘사람과 함께\n요즘사람이 되어봐요😎`}
          </ThemeText>
        </ThemeView>
        <ThemeView style={styles.start_Logo}>
          <ImageBackground style={styles.yozmin_charater_v1_0011} source={require('../assets/char_logo.jpeg')}/>
        </ThemeView>
        <TouchableOpacity onPress={() => navigation.replace("TabNavigator")}>
          <ThemeView style={styles.btnStart}>
            <ThemeText style={styles.lbStart}>
              {`시작하기`}
            </ThemeText>
          </ThemeView>
        </TouchableOpacity>
      </ThemeView>
  )
}

const styles = StyleSheet.create({
  start_FormContainer: {
    position: "relative",
    flexShrink: 0,
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 0,
    paddingHorizontal: width * 0.10,
    paddingVertical: height * 0.23,
  },
  startTitle: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.14,
    width: width * 0.70,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  lbStartTitle: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.70,
    height: height * 0.14,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Share",
    fontSize: width * 0.07,
    fontWeight: 700,
  },
  start_Logo: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.33,
    width: width * 0.56,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  yozmin_charater_v1_0011: {
    position: "absolute",
    flexShrink: 0,
    width: width * 0.56,
    height: height * 0.16,
  },
  btnStart: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.058,
    width: width * 0.79,
    backgroundColor: "rgba(118, 166, 255, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: width * 0.025,
    padding: width * 0.025,
    borderRadius: 30,
  },
  lbStart: {
    position: "relative",
    flexShrink: 0,
    textAlign: "center",
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Share",
    fontSize: width * 0.045,
    fontWeight: 700,
  }
});