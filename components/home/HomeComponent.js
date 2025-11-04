import {View, StyleSheet} from "react-native";
import ChatBotComponent from "../chatbot/ChatBotComponent";
import React, {useEffect} from "react";
import {useNavigation} from "@react-navigation/native";
import {useUserStore} from "../../stores/UserStore";
import supabase from "../../supabase";

// KST YYYY-MM-DD 함수 추가
function kstDateStr(d = new Date()) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}

const HomeComponent = () => {
    const navigation = useNavigation();
    const store = useUserStore();
    const userId = store.user_id;
    

    // 로그인 퀘스트
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
              // 오늘 row 없으면 새로 생성 후 업데이트
              await supabase.from("quest_progress_daily").insert([{
                user_id: uid,
                quest_no: 1,
                current_count: 1,
                quest_date: today,
                is_cleared: true,
                is_received: false,
              }]);
              console.log("✅ 퀘스트 1번 (로그인) 신규 생성 + 완료");
            } else if (!progress.is_cleared) {
              // row는 있는데 아직 완료 안 된 경우
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
          // ⏳ 퀘스트 생성 타이밍 기다리기 (예: 1초)
          setTimeout(() => {
            updateQuest_Login(userId);
          }, 1000);
        }
      
        if (!store.categories) {
          navigation.navigate("SelectCategory");
        }
      }, [userId, store.categories]);
      
    return (
        <View style={{ flex: 1 }}>
            <ChatBotComponent />
        </View>
    )
}

export default HomeComponent;