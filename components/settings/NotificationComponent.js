import React, { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PageTitleComponent from "../common/PageTitleComponent";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const NotificationSettings = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme(); // ⭐ 필수
  const { user_id: currentUserId } = useUserStore();

  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState({
    all: false,
    trend: false,
    board: false,
    news: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // 📌 Supabase에서 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("user_notification_settings")
          .select("*")
          .eq("user_id", currentUserId)
          .single();

        if (data) {
          setIsNotificationsEnabled({
            all: data.enabled_all,
            trend: data.enabled_trend,
            board: data.enabled_board,
            news: data.enabled_news,
          });
        } else {
          await saveSettings({
            all: false,
            trend: false,
            board: false,
            news: false,
          });
        }
      } catch (e) {
        console.log("알림 불러오기 실패:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [currentUserId]);

  // 📌 Supabase에 저장
  const saveSettings = async (settings) => {
    if (!currentUserId) return;

    try {
      await supabase.from("user_notification_settings").upsert(
        {
          user_id: currentUserId,
          enabled_all: settings.all,
          enabled_trend: settings.trend,
          enabled_board: settings.board,
          enabled_news: settings.news,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (e) {
      console.log("저장 실패:", e.message);
    }
  };

  // 📌 토글 변경
  const toggleSwitch = (type) => {
    setIsNotificationsEnabled((prev) => {
      let updated = { ...prev };

      if (type === "all") {
        const newState = !prev.all;
        updated = {
          all: newState,
          trend: newState,
          board: newState,
          news: newState,
        };
      } else {
        updated[type] = !prev[type];
        updated.all =
          updated.trend && updated.board && updated.news ? true : false;
      }

      saveSettings(updated);
      return updated;
    });
  };

  // 📌 로딩 화면
  if (isLoading) {
    return (
      <ThemeView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
        <ThemeText style={{ marginTop: 10, color: colors.text }}>
          알림 설정을 불러오는 중...
        </ThemeText>
      </ThemeView>
    );
  }

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageTitleComponent title="알림 설정" />

      <ThemeView
        style={[
          styles.settingsBox,
          { backgroundColor: colors.boxBackground, borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        {/* 전체 알림 */}
        <ThemeView style={styles.settingItem}>
          <ThemeText style={[styles.settingText, { color: colors.text }]}>
            전체 알림
          </ThemeText>
          <TouchableOpacity
            style={[
              styles.toggleContainer,
              { backgroundColor: isNotificationsEnabled.all ? colors.text : colors.border },
            ]}
            onPress={() => toggleSwitch("all")}
          >
            <ThemeView
              style={[
                styles.toggleCircle,
                {
                  backgroundColor: isDark ? "#fff" : "#fff",
                  left: isNotificationsEnabled.all ? 24 : 4,
                },
              ]}
            />
          </TouchableOpacity>
        </ThemeView>

        <ThemeView style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* 트렌드 */}
        <ThemeView style={styles.settingItem}>
          <ThemeText style={[styles.settingText, { color: colors.text }]}>

            트렌드
          </ThemeText>
          <TouchableOpacity
            style={[
              styles.toggleContainer,
              { backgroundColor: isNotificationsEnabled.trend ? colors.text : colors.border },
            ]}
            onPress={() => toggleSwitch("trend")}
          >
            <ThemeView
              style={[
                styles.toggleCircle,
                {
                  backgroundColor: isDark ? "#fff" : "#fff",
                  left: isNotificationsEnabled.trend ? 24 : 4,
                },
              ]}
            />
          </TouchableOpacity>
        </ThemeView>

        <ThemeView style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* 게시판 */}
        <ThemeView style={styles.settingItem}>
          <ThemeText style={[styles.settingText, { color: colors.text }]}>
            게시판
          </ThemeText>
          <TouchableOpacity
            style={[
              styles.toggleContainer,
              { backgroundColor: isNotificationsEnabled.board ? colors.text : colors.border },
            ]}
            onPress={() => toggleSwitch("board")}
          >
            <ThemeView
              style={[
                styles.toggleCircle,
                {
                  backgroundColor: isDark ? "#fff" : "#fff",
                  left: isNotificationsEnabled.board ? 24 : 4,
                },
              ]}
            />
          </TouchableOpacity>
        </ThemeView>

        <ThemeView style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* 뉴스 */}
        <ThemeView style={styles.settingItem}>
          <ThemeText style={[styles.settingText, { color: colors.text }]}>
            뉴스
          </ThemeText>
          <TouchableOpacity
            style={[
              styles.toggleContainer,
              { backgroundColor: isNotificationsEnabled.news ? colors.text : colors.border },
            ]}
            onPress={() => toggleSwitch("news")}
          >
            <ThemeView
              style={[
                styles.toggleCircle,
                {
                  backgroundColor: isDark ? "#fff" : "#fff",
                  left: isNotificationsEnabled.news ? 24 : 4,
                },
              ]}
            />
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>
    </ThemeView>
  );
};

export default NotificationSettings;

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  settingsBox: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 20,
    marginHorizontal: 15,
  },

  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },

  settingText: { fontSize: 16, fontWeight: "500" },

  separator: {
    height: 1,
    marginVertical: 6,
  },

  toggleContainer: {
    width: 50,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
  },

  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: "absolute",
    top: 4,
  },
});
