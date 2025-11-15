import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import ChatBotComponent from "../chatbot/ChatBotComponent";
import { useNavigation } from "@react-navigation/native";
import { useUserStore } from "../../stores/UserStore";
import supabase from "../../supabase";
import { ThemeView } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

// ✅ 한국 시간 변환 함수
function kstDateStr(d = new Date()) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}

const HomeComponent = () => {
  const navigation = useNavigation();
  const store = useUserStore();
  const userId = store.user_id;
  const { colors } = useTheme(); // ✅ 테마 색상 가져오기

  // ✅ 로그인 퀘스트 업데이트
  const updateQuest_Login = async (uid) => {
    if (!uid) return;
    try {
      const today = kstDateStr();
      const { data: progress } = await supabase
        .from("quest_progress_daily")
        .select("no, is_cleared, current_count")
        .eq("user_id", uid)
        .eq("quest_no", 1)
        .eq("quest_date", today)
        .maybeSingle();

      if (!progress) {
        await supabase.from("quest_progress_daily").insert([
          {
            user_id: uid,
            quest_no: 1,
            current_count: 1,
            quest_date: today,
            is_cleared: true,
            is_received: false,
          },
        ]);
        console.log("✅ 퀘스트 1번 (로그인) 신규 생성 + 완료");
      } else if (!progress.is_cleared) {
        await supabase
          .from("quest_progress_daily")
          .update({
            current_count: 1,
            is_cleared: true,
          })
          .eq("no", progress.no);
        console.log("✅ 퀘스트 1번 (로그인) 완료 처리");
      } else {
        console.log("ℹ️ 퀘스트 1번 (로그인)은 이미 오늘 완료됨");
      }
    } catch (e) {
      console.error("🚨 퀘스트 1번 업데이트 실패:", e.message);
    }
  };

  useEffect(() => {
    if (userId) {
      setTimeout(() => {
        updateQuest_Login(userId);
      }, 1000);
    }

    if (!store.categories) {
      navigation.navigate("SelectCategory");
    }
  }, [userId, store.categories]);

  return (
    // ✅ 테마에 맞게 배경 자동 변경
    <ThemeView style={[styles.container, { backgroundColor: colors.subBackground }]}>
      {/* ✅ ChatBotComponent 내부 텍스트 색도 테마 반응하도록 수정 */}
      <ChatBotComponent />
    </ThemeView>
  );
};

export default HomeComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
