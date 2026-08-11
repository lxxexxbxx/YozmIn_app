import React from "react";
import {Platform, StyleSheet, TouchableOpacity, Image} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ThemeView, ThemeText } from "./ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const PageTitleComponent = ({ title, backToTab, backToStack }) => {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme(); // ✅ 현재 테마 감지

  const back = () => {
    if (backToTab) navigation.navigate("TabNavigator", { screen: backToTab });
    else if (backToStack) navigation.navigate(backToStack);
    else navigation.goBack();
  };

  return (
    <ThemeView style={{borderBottomWidth: 1,borderBottomColor: colors.border }}>
    <ThemeView style={styles.header}>
      <TouchableOpacity style={styles.arrow} onPress={back}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={colors.text}
        />
      </TouchableOpacity>
      <Image source={
        require("../../assets/Yozmin_Logo_v0.1.png")
        } style={{width: 50, height: 50, resizeMode: "contain",marginLeft : 10}}
      />
      <ThemeText style={[styles.title, { color: colors.text, marginTop: Platform.OS === "ios" ? 14 : 7 }]}>
        {title}
      </ThemeText>
      <ThemeView style={styles.arrow} />
    </ThemeView>
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 45,
    marginLeft: 15,
    marginRight: 20,
    marginBottom : 10,
  },
  arrow: {
    marginTop: 13,
    width: 20,
  },
  title: {
    flexGrow: 1,
    textAlign: "left",
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 8,
  },
});

export default PageTitleComponent;
