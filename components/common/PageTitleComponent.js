import React from "react";
import {Platform, StyleSheet, TouchableOpacity} from "react-native";
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
    <ThemeView style={styles.header}>
      <TouchableOpacity style={styles.arrow} onPress={back}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={colors.text}
        />
      </TouchableOpacity>
      <ThemeText style={[styles.title, { color: colors.text, marginTop: Platform.OS === "ios" ? 10 : 3 }]}>
        {title}
      </ThemeText>
      <ThemeView style={styles.arrow} />
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    marginLeft: 20,
    marginRight: 20,
  },
  arrow: {
    marginTop: 8,
    width: 20,
  },
  title: {
    flexGrow: 1,
    textAlign: "left",
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
    marginLeft: 20,
  },
});

export default PageTitleComponent;
