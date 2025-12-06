// TodayQuestsScreen.js (헤더 디자인 통일 버전)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import QuestCard from "./QuestCard";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";
import PageTitleComponent from "../common/PageTitleComponent"; // ✅ 공통 헤더 추가

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
  const userId = useUserStore((s) => s.user_id);
  const { colors } = useTheme();

  const [items, setItems] = useState([]);
  const [remain, setRemain] = useState("00:00:00");
  const [loading, setLoading] = useState(false);

  // 자정까지 남은 시간
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

  const initTodayQuests = async () => {
    if (!userId) return;
    const today = kstDateStr();

    try {
      setLoading(true);

      await supabase
        .from("quest_progress_daily")
        .delete()
        .eq("user_id", userId)
        .eq("quest_date", today);

      const { data: masters, error: mErr } = await supabase
        .from("quests")
        .select("no, name, goal_count, reward_coin");

      if (mErr) throw mErr;
      if (!masters || masters.length < 4) {
        Alert.alert("알림", "quests 테이블에 최소 4개 이상 필요합니다.");
        return;
      }

      const loginQuest = masters.find((q) => q.no === 1);
      const randoms = masters
        .filter((q) => q.no !== 1)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const picks = [loginQuest, ...randoms];

      const payload = picks.map((q) => ({
        quest_no: q.no,
        user_id: userId,
        current_count: 0,
        quest_date: today,
        is_cleared: false,
        is_received: false,
      }));

      const { error: iErr } = await supabase
        .from("quest_progress_daily")
        .insert(payload);
      if (iErr) throw iErr;

      await new Promise((r) => setTimeout(r, 300));
      await checkToday();
    } catch (e) {
      console.log("❌ initTodayQuests 오류:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (quest) => {
    if (!userId) return;
    if (quest.claimed_at)
      return Alert.alert("안내", "이미 보상을 수령하셨습니다.");

    try {
      const { data, error } = await supabase.rpc(
        "claim_quest_and_reward",
        { p_row_no: quest.no, p_user_id: userId }
      );

      if (error) throw error;

      const newCoin = data?.[0]?.new_coin;

      if (typeof newCoin === "number") {
        useUserStore.getState().setter.setCoin(newCoin);
        Alert.alert("보상 수령 완료", `보상을 수령하셨습니다! (보유 코인: ${newCoin})`);
      }

      await checkToday();
    } catch (e) {
      console.log("❌ handleClaim 오류:", e);
      Alert.alert("오류", "보상 수령 중 문제가 발생했습니다.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!userId) return;

        let tries = 0;
        const today = kstDateStr();

        while (tries < 5) {
          const { data } = await supabase
            .from("quest_progress_daily")
            .select("quest_no")
            .eq("user_id", userId)
            .eq("quest_date", today);

          if (data && data.length >= 4) break;

          tries++;
          await new Promise((r) => setTimeout(r, 300));
        }

        // 🔥 로그인 퀘스트 자동 실행 제거 (버그 원인)
        // await supabase.rpc("update_quest_progress", { p_quest_no: 1, p_user_id: userId });

        await checkToday();
      })();
    }, [userId])
  );

  useEffect(() => {
    let last = kstDateStr();
    const t = setInterval(async () => {
      const now = kstDateStr();
      if (now !== last) {
        last = now;
        await initTodayQuests();
      }
    }, 60000);
    return () => clearInterval(t);
  }, [userId]);

  const summary = useMemo(() => {
    const total = items.length;
    const done = items.filter((it) => it.is_cleared).length;
    const claimed = items.filter((it) => !!it.claimed_at).length;
    return { total, done, claimed };
  }, [items]);

  return (
    <ThemeView style={[s.screen, { backgroundColor: colors.background }]}>
      {/* 🔹 공통 상단바 (옷장 / 북마크와 통일) */}
      <PageTitleComponent title={"퀘스트"} />

      {/* 🔹 내용 영역 */}
      <ThemeView style={s.content}>
        <ThemeView
          style={[
            s.topCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Image
            source={require("../../assets/quest_tino.png")}
            style={s.tino}
            resizeMode="contain"
          />

          <ThemeView style={{ flex: 1, marginLeft: 12 }}>
            <ThemeText style={[s.h1, { color: colors.text }]}>
              오늘의 퀘스트
            </ThemeText>

            <ThemeText style={[s.sub, { color: colors.subText }]}>
              완료 {summary.done}/{summary.total} · 수령 {summary.claimed}/
              {summary.total}
            </ThemeText>

            <ThemeView
              style={[
                s.badgeRow,
                {
                  backgroundColor: colors.boxBackground,
                  borderColor: colors.border,
                },
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
          keyExtractor={(item, idx) =>
            String(item.no || item.quest_no || idx)
          }
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 6 }}
          renderItem={({ item }) => (
            <QuestCard quest={item} onClaimPress={handleClaim} />
          )}
          ItemSeparatorComponent={() => (
            <ThemeView style={{ height: 12 }} />
          )}
        />
      </ThemeView>
    </ThemeView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // 🔹 (예전 헤더 스타일 – 지금은 PageTitleComponent 사용, 남겨둠)
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginTop: 20,
  },
  headerBackBtn: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  headerRightSpacer: {
    width: 30,
  },

  // 🔹 내용 전체 패딩
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  topCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tino: { width: 76, height: 76, borderRadius: 16 },
  h1: { fontSize: 20, fontWeight: "800" },
  sub: { marginTop: 4, fontSize: 14 },
  badgeRow: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeTxt: { fontWeight: "700" },
});
