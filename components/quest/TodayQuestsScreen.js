// TodayQuestsScreen.js (수정된 안정 버전)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Image, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import QuestCard from "./QuestCard";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

// ✅ KST 날짜 변환 함수
function kstDateStr(d = new Date()) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}

function msToHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function TodayQuestsScreen() {
  const navigation = useNavigation();
  const { user_id: userId } = useUserStore();
  const { colors } = useTheme();

  const [items, setItems] = useState([]);
  const [remain, setRemain] = useState("00:00:00");
  const [loading, setLoading] = useState(false);

  // ⏰ 자정까지 남은 시간 표시
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      setRemain(msToHMS(next - now));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // ✅ 오늘의 퀘스트 불러오기
  const checkToday = async () => {
    if (!userId) return;
    setLoading(true);
    const today = kstDateStr();

    try {
      const { data: rows, error } = await supabase
        .from("quest_progress_daily")
        .select(`
          no,
          quest_no,
          current_count,
          claimed_at,
          is_cleared,
          quests (name, goal_count, reward_coin)
        `)
        .eq("user_id", userId)
        .eq("quest_date", today)
        .order("no", { ascending: true });

      if (error) throw error;

      if (!rows || rows.length < 4) {
        console.log(`오늘 퀘스트 ${rows?.length || 0}개 → 새로 생성`);
        await initTodayQuests();
        return;
      }

      setItems(rows);
    } catch (e) {
      console.log("❌ checkToday 오류:", e);
      Alert.alert("오류", "오늘의 퀘스트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 오늘의 퀘스트 4개 생성 (로그인 고정 + 3개 랜덤)
  const initTodayQuests = async () => {
    if (!userId) return;
    const today = kstDateStr();
    try {
      setLoading(true);

      await supabase.from("quest_progress_daily").delete().eq("user_id", userId).eq("quest_date", today);

      const { data: masters, error: mErr } = await supabase
        .from("quests")
        .select("no, name, goal_count, reward_coin");
      if (mErr) throw mErr;

      if (!masters || masters.length < 4) {
        Alert.alert("알림", "quests 테이블에 최소 4개 이상의 퀘스트가 필요합니다.");
        return;
      }

      const loginQuest = masters.find((q) => q.no === 1);
      const randoms = masters.filter((q) => q.no !== 1).sort(() => 0.5 - Math.random()).slice(0, 3);
      const picks = [loginQuest, ...randoms];
      const payload = picks.map((q) => ({
        quest_no: q.no,
        user_id: userId,
        current_count: q.no === 1 ? 1 : 0,
        quest_date: today,
        is_cleared: q.no === 1 ? true : false,
        is_received: false,
      }));

      const { error: iErr } = await supabase.from("quest_progress_daily").insert(payload);
      if (iErr) throw iErr;

      console.log("✅ 오늘의 퀘스트 새로 생성 완료");
      await new Promise((r) => setTimeout(r, 300));
      await checkToday();
    } catch (e) {
      console.log("❌ initTodayQuests 오류:", e);
      Alert.alert("오류", "오늘의 퀘스트 생성 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 보상 수령 함수
  const handleClaim = async (quest) => {
    if (!userId) return;
    if (quest.claimed_at) return Alert.alert("안내", "이미 보상을 수령하셨습니다.");

    try {
      const { data, error } = await supabase.rpc("claim_quest_and_reward", {
        p_row_no: quest.no,
        p_user_id: userId,
      });
      if (error) throw error;

      const newCoin = data?.[0]?.new_coin;
      if (typeof newCoin === "number") {
        useUserStore.getState().setCoin(newCoin);
        Alert.alert("보상 수령 완료", `보상을 수령하셨습니다! (보유 코인: ${newCoin})`);
        await checkToday();
      }
    } catch (e) {
      console.log("❌ handleClaim 오류:", e);
      if (String(e.message).includes("ALREADY_CLAIMED")) {
        Alert.alert("안내", "이미 보상을 수령하셨습니다.");
      } else {
        Alert.alert("오류", "보상 수령 중 문제가 발생했습니다.");
      }
    }
  };

  // ⏰ 자정 감지 후 자동 초기화
  useEffect(() => {
    let last = kstDateStr();
    const t = setInterval(async () => {
      const now = kstDateStr();
      if (now !== last) {
        last = now;
        await initTodayQuests();
      }
    }, 60 * 1000);
    return () => clearInterval(t);
  }, [userId]);

  // ✅ 화면 진입 시 새로고침
  useFocusEffect(useCallback(() => { checkToday(); }, [userId]));

  const summary = useMemo(() => {
    const total = items.length;
    const done = items.filter((it) => it.is_cleared).length;
    const claimed = items.filter((it) => !!it.claimed_at).length;
    return { total, done, claimed };
  }, [items]);

  return (
    <ThemeView style={[s.screen, { backgroundColor: colors.background }]}>
      <ThemeView style={s.header}>
        <ThemeText style={[s.title, { color: colors.text }]}>오늘의 퀘스트</ThemeText>
        <TouchableOpacity
          onPress={() =>
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate("MyPage")
          }
          style={[s.secondaryBtn, { backgroundColor: colors.boxBackground }]}
        >
          <Ionicons name="chevron-back" size={16} color={colors.text} />
          <ThemeText style={[s.secondaryBtnText, { color: colors.text }]}>뒤로</ThemeText>
        </TouchableOpacity>
      </ThemeView>

      {/* ✅ 상단 경계 자연스럽게 복원 */}
      <ThemeView
        style={[
          s.topCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.text,
          },
        ]}
      >
        <Image source={require("../../assets/quest_tino.png")} style={s.tino} resizeMode="contain" />
        <ThemeView style={{ flex: 1, marginLeft: 12 }}>
          <ThemeText style={[s.h1, { color: colors.text }]}>오늘의 퀘스트</ThemeText>
          <ThemeText style={[s.sub, { color: colors.subText }]}>
            완료 {summary.done}/{summary.total} · 수령 {summary.claimed}/{summary.total}
          </ThemeText>
          <ThemeView
            style={[
              s.badgeRow,
              { backgroundColor: colors.boxBackground, borderColor: colors.border },
            ]}
          >
            <ThemeText style={[s.badgeTxt, { color: colors.text }]}>
              ⏳ 자정까지 {remain}
            </ThemeText>
          </ThemeView>
        </ThemeView>
      </ThemeView>

      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.no ?? item.quest_no ?? index)}
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 6 }}
        ItemSeparatorComponent={() => <ThemeView style={{ height: 12 }} />}
        ListEmptyComponent={
          !loading ? (
            <ThemeView style={{ padding: 24, alignItems: "center" }}>
              <ThemeText>오늘의 퀘스트가 없습니다.</ThemeText>
            </ThemeView>
          ) : null
        }
        renderItem={({ item }) => <QuestCard quest={item} onClaimPress={handleClaim} />}
      />
    </ThemeView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  secondaryBtnText: { marginLeft: 6, fontSize: 12, fontWeight: "700" },
  // ✅ 경계선 & 그림자 추가
  topCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tino: { width: 76, height: 76, borderRadius: 16 },
  h1: { fontSize: 20, fontWeight: "800" },
  sub: { marginTop: 4, fontSize: 14 },
  badgeRow: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeTxt: { fontWeight: "700" },
});
