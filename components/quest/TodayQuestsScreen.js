// screens/TodayQuestsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import QuestCard from "./QuestCard";

// KST YYYY-MM-DD
function kstDateStr(d = new Date()) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}
// HH:MM:SS
function msToHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TodayQuestsScreen() {
  const navigation = useNavigation();
  const { user_id: userId } = useUserStore(); // 문자열 아이디

  const [items, setItems] = useState([]); // [{rowNo, questNo, current, claimedAt, quest:{no,name,goal_count,reward_coin}}]
  const [remain, setRemain] = useState("00:00:00");
  const [loading, setLoading] = useState(false);

  // 인트로(오늘 처음 받는 경우) 상태
  const [showIntro, setShowIntro] = useState(false);
  const introMsgs = [
    "오늘도 퀘스트를 시작해볼까?",
    "랜덤으로 3개의 퀘스트를 줄게!",
    "준비됐지? 시작하자!",
  ];
  const [introStep, setIntroStep] = useState(0);

  // 세션의 user_metadata.username에 내 userId를 싱크 (RPC에서 권한확인용)
  useEffect(() => {
    (async () => {
      try {
        if (userId) await supabase.auth.updateUser({ data: { username: userId } });
      } catch (_) {}
    })();
  }, [userId]);

  // 자정 카운트다운
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

  const setItemsFromRows = async (rows) => {
    const ids = [...new Set((rows || []).map((r) => r.quest_no))];
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    const { data: masters, error } = await supabase
      .from("quests")
      .select("no, name, goal_count, reward_coin")
      .in("no", ids);
    if (error) throw error;

    const byId = new Map((masters || []).map((m) => [m.no, m]));
    const merged =
      rows?.map((r) => ({
        rowNo: r.no,
        questNo: r.quest_no,
        current: r.current_count,
        claimedAt: r.claimed_at,
        quest: byId.get(r.quest_no),
      })) || [];
    setItems(merged);
  };

  const checkToday = async () => {
    if (!userId) return;
    setLoading(true);
    const today = kstDateStr();
    try {
      const { data: rows, error } = await supabase
        .from("quest_progress_daily")
        .select("no, quest_no, current_count, claimed_at, quest_date")
        .eq("user_id", userId)
        .eq("quest_date", today);

      if (error) throw error;

      if (!rows || rows.length === 0) {
        setShowIntro(true);
        setItems([]);
      } else {
        await setItemsFromRows(rows);
        setShowIntro(false);
      }
    } catch (e) {
      console.log(e);
      Alert.alert("오류", "퀘스트를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  const initTodayQuests = async () => {
    if (!userId) return;
    const today = kstDateStr();
    try {
      setLoading(true);

      const { data: masters, error: mErr } = await supabase
        .from("quests")
        .select("no, name, goal_count, reward_coin");
      if (mErr) throw mErr;

      const picks = shuffle(masters || []).slice(0, 3);
      if (picks.length === 0) {
        Alert.alert("알림", "퀘스트 마스터가 비어있습니다.");
        setShowIntro(false);
        return;
      }

      const payload = picks.map((q) => ({
        quest_no: q.no,
        user_id: userId,
        current_count: 0,
        quest_date: today,
      }));

      const { error: iErr } = await supabase
        .from("quest_progress_daily")
        .insert(payload);
      if (iErr) throw iErr;

      const { data: rows, error: rErr } = await supabase
        .from("quest_progress_daily")
        .select("no, quest_no, current_count, claimed_at, quest_date")
        .eq("user_id", userId)
        .eq("quest_date", today);
      if (rErr) throw rErr;

      await setItemsFromRows(rows || []);
      setShowIntro(false);
      setIntroStep(0);
    } catch (e) {
      console.log(e);
      Alert.alert("오류", "오늘의 퀘스트를 시작하지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkToday();
  }, [userId]);

  // 진행 +1
  const handleAdd = async (rowNo, current, goal) => {
    try {
      const next = Math.min(current + 1, goal);
      const { data, error } = await supabase
        .from("quest_progress_daily")
        .update({ current_count: next })
        .eq("no", rowNo)
        .select("no, current_count, claimed_at")
        .single();
      if (error) throw error;

      setItems((prev) =>
        prev.map((it) =>
          it.rowNo === rowNo ? { ...it, current: data.current_count } : it
        )
      );
    } catch (e) {
      console.log(e);
      Alert.alert("오류", "진행을 업데이트하지 못했습니다.");
    }
  };

  // ✅ 보상 수령: 서버 RPC(원자적) 사용
  const handleClaim = async (rowNo, current, goal, reward, claimedAt) => {
    if (claimedAt) return;
    if (current < goal) {
      Alert.alert("안내", "목표를 달성해야 수령할 수 있어요.");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("claim_quest_and_reward", {
        p_row_no: rowNo,
        p_user_id: userId, // 문자열 아이디
      });

      if (error) {
        const msg = String(error.message || "");
        if (msg.includes("NOT_COMPLETED")) {
          Alert.alert("안내", "아직 목표를 채우지 않았어요.");
        } else if (msg.includes("FORBIDDEN")) {
          Alert.alert("오류", "권한이 없습니다.");
        } else {
          Alert.alert("오류", "보상 수령에 실패했습니다.");
        }
        return;
      }

      setItems((prev) =>
        prev.map((it) =>
          it.rowNo === rowNo
            ? { ...it, claimedAt: new Date().toISOString() }
            : it
        )
      );

      // 선택: 새로운 코인 값 로그/스토어 반영
      const newCoin = data?.[0]?.new_coin;
      if (typeof newCoin === "number") {
        console.log("새 코인:", newCoin);
        // 필요 시 스토어 동기화 로직 추가
      }
    } catch (e) {
      console.log(e);
      Alert.alert("오류", "보상 수령에 실패했습니다.");
    }
  };

  const summary = useMemo(() => {
    const total = items.length;
    const done = items.filter(
      (it) => it.current >= (it.quest?.goal_count || 0)
    ).length;
    const claimed = items.filter((it) => !!it.claimedAt).length;
    return { total, done, claimed };
  }, [items]);

  if (showIntro) {
    const last = introStep >= introMsgs.length - 1;
    return (
      <View style={s.screen}>
        <View className="header" style={s.header}>
          <Text style={s.title}>퀘스트</Text>
          <View style={s.rowCenter}>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("MyPage")
              }
            >
              <Ionicons name="chevron-back" size={16} />
              <Text style={s.secondaryBtnText}>뒤로</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.introWrap}>
          <Image
            source={require("../../assets/quest_tino.png")}
            style={s.introImg}
            resizeMode="contain"
          />

          <View style={s.bubbleWrap}>
            <View style={s.bubble}>
              <Text style={s.bubbleTxt}>{introMsgs[introStep]}</Text>
            </View>
            <View style={s.bubbleTail} />
          </View>

          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => {
                if (!last) setIntroStep((i) => i + 1);
                else initTodayQuests();
              }}
            >
              <Text style={s.primaryBtnTxt}>{last ? "시작하기" : "다음"}</Text>
            </TouchableOpacity>
            {!last && (
              <TouchableOpacity
                style={[s.secondaryBtn, { alignSelf: "center", marginTop: 8 }]}
                onPress={initTodayQuests}
              >
                <Text style={s.secondaryBtnText}>건너뛰고 시작</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>퀘스트</Text>
        <View style={s.rowCenter}>
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("MyPage")
            }
          >
            <Ionicons name="chevron-back" size={16} />
            <Text style={s.secondaryBtnText}>뒤로</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.topCard}>
        <Image
          source={require("../../assets/quest_tino.png")}
          style={s.tino}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={s.h1}>오늘의 퀘스트</Text>
          <Text style={s.sub}>
            완료 {summary.done}/{summary.total} · 수령 {summary.claimed}/
            {summary.total}
          </Text>
          <View style={s.badgeRow}>
            <Text style={s.badgeTxt}>⏳ 자정까지 {remain}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.rowNo)}
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 6 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text>오늘의 퀘스트가 없습니다.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <QuestCard
            title={item.quest?.name ?? "퀘스트"}
            current={item.current}
            goal={item.quest?.goal_count ?? 1}
            reward={item.quest?.reward_coin ?? 0}
            claimedAt={item.claimedAt}
            onAddPress={() =>
              handleAdd(item.rowNo, item.current, item.quest?.goal_count ?? 1)
            }
            onClaimPress={() =>
              handleClaim(
                item.rowNo,
                item.current,
                item.quest?.goal_count ?? 1,
                item.quest?.reward_coin ?? 0,
                item.claimedAt
              )
            }
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "700" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F7",
  },
  secondaryBtnText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#394150",
  },

  // 인트로
  introWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  introImg: {
    width: 260,
    height: 260,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  bubbleWrap: {
    marginTop: 16,
    alignItems: "center",
    maxWidth: "90%",
  },
  bubble: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  bubbleTxt: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    marginTop: -1,
  },
  primaryBtn: {
    alignSelf: "center",
    backgroundColor: "#2F80ED",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "800" },

  // 리스트 상단 카드
  topCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  tino: { width: 76, height: 76, borderRadius: 16, backgroundColor: "#fff" },
  h1: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  sub: { color: "#64748b", marginTop: 4 },
  badgeRow: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  badgeTxt: { color: "#3730a3", fontWeight: "700" },
});
