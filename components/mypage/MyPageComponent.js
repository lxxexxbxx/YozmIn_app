import React, { useEffect, useState, useRef, useCallback } from "react";
import { Text, View, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Entypo from "react-native-vector-icons/Entypo";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";

const CELL_SIZE = 70;
const STAGE_W = 260;
const STAGE_H = 260;
const OFFSET_X = 0;
const OFFSET_Y = 0;
const CATS = ["HAT", "ACCESSORY", "BACKGROUND"];

const IMAGE_BY_DB_NAME = {
  "black cap": require("../../assets/black cap.png"),
  "black sunglasses": require("../../assets/black sunglasses.png"),
  "black hair": require("../../assets/black hair.png"),
};

function kstDateStr(d = new Date()) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}

const updateQuest_Login = async (uid) => {
  if (!uid) return;
  try {
    const today = kstDateStr();
    const { data: progress } = await supabase
      .from("quest_progress_daily")
      .select("no")
      .eq("user_id", uid)
      .eq("quest_no", 1)
      .eq("quest_date", today);

    if (!progress?.length) {
      await supabase.rpc("update_quest_progress", {
        p_quest_no: 1,
        p_user_id: uid,
      });
    }
  } catch (e) {
    console.warn("로그인 퀘스트 업데이트 실패:", e.message);
  }
};

const MyPageComponent = () => {
  const navigation = useNavigation();
  const store = useUserStore();
  const userId = store.user_id;
  const name = store.name;
  const coin = store.coin;
  const setCoin = store.setCoin;

  const [characterName, setCharacterName] = useState("");
  const [level, setLevel] = useState(0);
  const [wearing, setWearing] = useState({ HAT: null, ACCESSORY: null, BACKGROUND: null });
  const [refreshing, setRefreshing] = useState(false);

  const channelRef = useRef(null);

  // 마이페이지 데이터 불러오기
  const fetchCharacterData = useCallback(
    async (uid) => {
      const { data, error } = await supabase
        .from("mypage")
        .select("mp_Name, mp_Level, mp_Coin")
        .eq("user_id", uid)
        .single();

      if (error) {
        console.error("데이터 조회 실패:", error);
        Alert.alert("오류", "마이페이지 데이터를 불러오는 데 실패했습니다.");
        return;
      }

      setCharacterName(data?.mp_Name ?? "");
      setLevel(data?.mp_Level ?? 0);
      const newCoin = Number(data?.mp_Coin ?? 0);

      // DB 코인을 전역 상태와 동기화
      if (newCoin !== store.coin) {
        setCoin(newCoin);
      }
    },
    [store.coin, setCoin]
  );

  // 착용 아이템 불러오기
  const fetchEquippedItems = useCallback(async (uid) => {
    try {
      const { data: uiRows, error: uiErr } = await supabase
        .from("user_items")
        .select("item_no, category, equipped")
        .eq("user_id", uid)
        .eq("equipped", true);

      if (uiErr || !uiRows?.length) {
        setWearing({ HAT: null, ACCESSORY: null, BACKGROUND: null });
        return;
      }

      const ids = [...new Set(uiRows.map((r) => Number(r.item_no)).filter(Boolean))];
      const { data: siRows, error: siErr } = await supabase
        .from("shop_items")
        .select("no, name, category, x, y")
        .in("no", ids);

      if (siErr || !siRows) {
        setWearing({ HAT: null, ACCESSORY: null, BACKGROUND: null });
        return;
      }

      const map = new Map(siRows.map((s) => [Number(s.no), s]));
      const nextWear = { HAT: null, ACCESSORY: null, BACKGROUND: null };

      uiRows.forEach((u) => {
        const s = map.get(Number(u.item_no));
        if (!s) return;
        const item = {
          id: String(s.no),
          title: s.name,
          category: s.category,
          x: s.x ?? 0,
          y: s.y ?? 0,
          imageSrc: IMAGE_BY_DB_NAME[s.name] || null,
        };
        if (CATS.includes(item.category)) nextWear[item.category] = item;
      });

      setWearing(nextWear);
    } catch (e) {
      console.log("착용 아이템 조회 오류:", e);
    }
  }, []);

  // 전체 새로고침
  const refreshAll = useCallback(async () => {
    if (!userId) return;
    try {
      setRefreshing(true);
      await Promise.all([fetchCharacterData(userId), fetchEquippedItems(userId)]);
    } finally {
      setRefreshing(false);
    }
  }, [userId, fetchCharacterData, fetchEquippedItems]);

  // 초기 실행
  useEffect(() => {
    if (!userId) {
      Alert.alert("오류", "로그인 정보가 없습니다.");
      return;
    }
    refreshAll();
    updateQuest_Login(userId);
  }, [userId, refreshAll]);

  // 실시간 DB 변화 감지
  useEffect(() => {
    if (!userId) return;
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }

    const ch = supabase
      .channel(`mypage-live-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mypage", filter: `user_id=eq.${userId}` },
        (payload) => {
          const newCoin = payload?.new?.mp_Coin;
          if (typeof newCoin === "number") {
            setCoin(newCoin);
          }
          fetchCharacterData(userId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_items", filter: `user_id=eq.${userId}` },
        () => fetchEquippedItems(userId)
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {}
    };
  }, [userId, fetchCharacterData, fetchEquippedItems, setCoin]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image style={styles.profileImage} source={require("../../assets/User.jpg")} />
          <View>
            <Text style={styles.username}>{name}</Text>
            <Text style={styles.level}>Lv. {level}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")}>
            <Ionicons name="settings" size={24} color="black" style={styles.iconSpacing} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Bookmark")}>
            <Ionicons name="bookmark" size={24} color="black" style={styles.iconSpacing} />
          </TouchableOpacity>

          <TouchableOpacity onPress={refreshAll}>
            <Ionicons name={refreshing ? "reload" : "refresh"} size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 캐릭터 카드 */}
      <View style={styles.characterBox}>
        <View style={styles.characterHeader}>
          <Text style={styles.characterTitle}>{characterName}</Text>
          <MaterialCommunityIcons name="currency-usd" size={24} color="gold" />
          <Text style={styles.money}>{coin} 원</Text>
        </View>

        <View style={styles.tinoStage}>
          <Image style={styles.characterImage} source={require("../../assets/tino.png")} />
          {CATS.map((cat) => {
            const it = wearing[cat];
            if (!it) return null;
            return (
              <View
                key={cat}
                style={[
                  styles.overlayWrap,
                  { left: OFFSET_X + (it.x || 0) * CELL_SIZE, top: OFFSET_Y + (it.y || 0) * CELL_SIZE },
                ]}
                pointerEvents="none"
              >
                {it.imageSrc ? <Image source={it.imageSrc} style={styles.overlayImage} /> : null}
              </View>
            );
          })}
        </View>

        {/* 하단 메뉴 */}
        <View style={styles.bottomNav}>
          <View style={styles.iconRow}>
            <TouchableOpacity onPress={() => navigation.navigate("Shop")}>
              <Entypo name="shop" size={24} color="black" style={styles.iconSpacing} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("closet")}>
              <MaterialCommunityIcons name="wardrobe" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("TodayQuests")}>
              <MaterialCommunityIcons name="script-text-outline" size={26} color="black" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MyPageComponent;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5", marginTop: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 30 },
  profileInfo: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  username: { fontSize: 18, fontWeight: "bold" },
  level: { fontSize: 14, color: "gray" },
  headerRight: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  iconSpacing: { marginRight: 10 },

  characterBox: { backgroundColor: "white", padding: 20, borderRadius: 20, alignItems: "center", marginTop: 40 },
  characterHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  money: { fontSize: 18, fontWeight: "bold", textDecorationLine: "underline", color: "black", marginLeft: 5 },
  characterTitle: { fontSize: 18, fontWeight: "bold", marginRight: 8 },

  tinoStage: { width: STAGE_W, height: STAGE_H, position: "relative", alignSelf: "center" },
  characterImage: { position: "absolute", left: 0, top: 0, width: STAGE_W, height: STAGE_H, resizeMode: "contain" },
  overlayWrap: { position: "absolute", width: CELL_SIZE, height: CELL_SIZE, alignItems: "center", justifyContent: "center" },
  overlayImage: { width: CELL_SIZE, height: CELL_SIZE, resizeMode: "contain" },

  bottomNav: { flexDirection: "row", justifyContent: "flex-end", width: "100%", marginTop: 10 },
  iconRow: { flexDirection: "row", alignItems: "center" },
});
