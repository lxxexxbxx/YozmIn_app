import React, { useState, useEffect } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Appearance } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PageTitleComponent from "../common/PageTitleComponent";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const GeneralSettings = () => {
  const navigation = useNavigation();
  const { colors } = useTheme(); // ✅ theme colors 선언
  const [theme, setTheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <PageTitleComponent title="일반 설정" />

      <ThemeView style={styles.mainBox}>
        {/* 설정 박스 */}
        <ThemeView
          style={[
            styles.settingsBox,
            {
              backgroundColor: colors.boxBackground,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <TouchableOpacity style={styles.settingItem}>
            <ThemeText style={[styles.settingText, { color: colors.text }]}>
              화면 테마
            </ThemeText>

            <ThemeText style={[styles.themeText, { color: colors.subText }]}>
              기기 테마 사용
            </ThemeText>
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  mainBox: {
    marginTop: 20,
    marginHorizontal: 15,
  },

  settingsBox: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },

  settingItem: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  settingText: {
    fontSize: 16,
  },

  themeText: {
    fontSize: 14,
  },
});

export default GeneralSettings;
