// screens/ClosetScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";

// 캐릭터 스테이지 & 좌표 스케일(칸 단위)
const CELL_SIZE = 70;
const STAGE_W = 260;
const STAGE_H = 260;
const OFFSET_X = 0;
const OFFSET_Y = 0;

// 카테고리/탭
const TABS = ["모자", "악세서리", "배경"];
const KO_TO_CATEGORY = { 모자: "HAT", 악세서리: "ACCESSORY", 배경: "BACKGROUND" };
const CATEGORY_TO_ICON = { HAT: "hat-fedora", ACCESSORY: "glasses", BACKGROUND: "image-area" };
const CATS = ["HAT", "ACCESSORY", "BACKGROUND"];

// DB name → 로컬 이미지 매핑(파일 존재해야 함)
const IMAGE_BY_DB_NAME = {
  "black cap": require("../../assets/black cap.png"),
  "black sunglasses": require("../../assets/black sunglasses.png"),
  "black hair": require("../../assets/black hair.png"),
};

const ClosetItemCard = ({ item, selected, onPreview, onEquipToggle }) => {
  return (
    <TouchableOpacity style={[styles.itemCard, selected && styles.itemCardActive]} onPress={() => onPreview(item)}>
      {item.imageSrc ? (
        <Image source={item.imageSrc} style={styles.cardThumb} />
      ) : (
        <MaterialCommunityIcons name={item.icon} size={36} />
      )}
      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>

      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <MaterialCommunityIcons name="currency-usd" size={14} />
          <Text style={styles.itemPrice}>{item.price}</Text>
        </View>

        {selected ? (
          <View style={styles.badgeOn}><Text style={styles.badgeText}>입힘</Text></View>
        ) : (
          <View style={styles.badgeOff}><Text style={styles.badgeText}>입혀보기</Text></View>
        )}
      </View>

      {/* 장착/해제 버튼 */}
      <TouchableOpacity style={[styles.equipBtn, item.equipped && styles.equipBtnOn]} onPress={() => onEquipToggle(item)}>
        <Text style={[styles.equipBtnText, item.equipped && { color: "#fff" }]}>
          {item.equipped ? "해제" : "장착"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function ClosetScreen() {
  const navigation = useNavigation();
  const { user_id: userId } = useUserStore();

  const [tab, setTab] = useState("모자");
  const [ownedItems, setOwnedItems] = useState([]); // 내 옷장 아이템
  const [wearing, setWearing] = useState({ HAT: null, ACCESSORY: null, BACKGROUND: null }); // 화면 프리뷰 상태
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const numColumns = isWide ? 3 : 2;

  // 내 옷장 불러오기: user_items → shop_items join (두 번에 나눠서)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!userId) return;
        setLoading(true);

        const { data: uiRows, error: uiErr } = await supabase
          .from("user_items")
          .select("item_no, category, equipped")
          .eq("user_id", userId);

        if (uiErr || !uiRows?.length) {
          if (!cancelled) setOwnedItems([]);
          return;
        }

        const ids = [...new Set(uiRows.map((r) => Number(r.item_no)).filter(Boolean))];
        const { data: siRows, error: siErr } = await supabase
          .from("shop_items")
          .select("no, name, category, price, x, y")
          .in("no", ids);

        if (siErr || !siRows) {
          if (!cancelled) setOwnedItems([]);
          return;
        }

        const map = new Map(siRows.map((s) => [Number(s.no), s]));
        const merged = uiRows
          .map((u) => {
            const s = map.get(Number(u.item_no));
            if (!s) return null;
            return {
              id: String(s.no),
              title: s.name,
              price: s.price,
              category: s.category,
              x: s.x ?? 0,
              y: s.y ?? 0,
              imageSrc: IMAGE_BY_DB_NAME[s.name] || null,
              icon: CATEGORY_TO_ICON[s.category] || "shape",
              equipped: !!u.equipped,
            };
          })
          .filter(Boolean);

        if (!cancelled) {
          setOwnedItems(merged);

          // 초기 프리뷰: equipped=true인 것들을 카테고리별로 세팅
          const initWear = { HAT: null, ACCESSORY: null, BACKGROUND: null };
          for (const it of merged) {
            if (it.equipped && CATS.includes(it.category)) {
              initWear[it.category] = it;
            }
          }
          setWearing(initWear);
        }
      } catch (e) {
        console.log(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // 현재 탭 아이템
  const listItems = useMemo(() => {
    const cat = KO_TO_CATEGORY[tab];
    return ownedItems
      .filter((it) => it.category === cat)
      .sort((a, b) => (a.y - b.y) || (a.x - b.x));
  }, [tab, ownedItems]);

  // 프리뷰(입혀보기): 카테고리 단일 선택
  const handlePreview = (item) => {
    setWearing((prev) => ({ ...prev, [item.category]: item }));
  };

  // 장착/해제
  const handleEquipToggle = async (item) => {
    try {
      if (!userId) return;
      const itemNo = Number(item.id);
      if (!itemNo) return;

      if (item.equipped) {
        // 이미 장착 → 해당 아이템만 해제
        const { error } = await supabase
          .from("user_items")
          .update({ equipped: false })
          .eq("user_id", userId)
          .eq("item_no", itemNo);
        if (error) throw error;

        setOwnedItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, equipped: false } : it))
        );
        setWearing((prev) => ({ ...prev, [item.category]: null }));
        return;
      }

      // 장착 안됨 → 같은 카테고리 전부 해제 후 이 아이템만 장착
      const { error: err1 } = await supabase
        .from("user_items")
        .update({ equipped: false })
        .eq("user_id", userId)
        .eq("category", item.category);
      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from("user_items")
        .update({ equipped: true })
        .eq("user_id", userId)
        .eq("item_no", itemNo);
      if (err2) throw err2;

      setOwnedItems((prev) =>
        prev.map((it) =>
          it.category === item.category ? { ...it, equipped: it.id === item.id } : it
        )
      );
      setWearing((prev) => ({ ...prev, [item.category]: { ...item, equipped: true } }));
    } catch (e) {
      console.log("equip toggle error:", e);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.scrollContent, { flexDirection: isWide ? "row" : "column" }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* 왼쪽: 캐릭터 미리보기 */}
        <View style={[styles.leftPanel, isWide ? styles.leftPanelWide : styles.leftPanelNarrow]}>
          <View style={styles.previewHeader}>
            <Text style={styles.title}>옷장</Text>
            <View style={styles.rowCenter}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate("Shop")}
              >
                <MaterialCommunityIcons name="storefront-outline" size={16} />
                <Text style={styles.secondaryBtnText}>상점 가기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { marginLeft: 8 }]}
                onPress={() =>
                  navigation.canGoBack() ? navigation.goBack() : navigation.navigate("MyPage")
                }
              >
                <Ionicons name="chevron-back" size={16} />
                <Text style={styles.secondaryBtnText}>뒤로</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.characterCard}>
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
                    {it.imageSrc ? (
                      <Image source={it.imageSrc} style={styles.overlayImage} />
                    ) : (
                      <MaterialCommunityIcons name={it.icon} size={36} />
                    )}
                  </View>
                );
              })}
            </View>
            {/* wearingBar 삭제됨 */}
          </View>
        </View>

        {/* 오른쪽: 옷장 리스트 */}
        <View style={[styles.rightPanel, isWide ? styles.rightPanelWide : styles.rightPanelNarrow]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>내 아이템</Text>
            <View style={styles.tabBar}>
              {TABS.map((label, idx) => {
                const active = tab === label;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.tabBtn, active && styles.tabBtnActive, idx !== TABS.length - 1 && { marginRight: 8 }]}
                    onPress={() => setTab(label)}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <FlatList
            data={listItems}
            key={numColumns}
            keyExtractor={(it) => it.id}
            numColumns={numColumns}
            scrollEnabled={false}
            nestedScrollEnabled
            contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 6 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              !loading ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Text>이 카테고리에 아이템이 없어요.</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <ClosetItemCard
                item={item}
                selected={wearing[item.category]?.id === item.id}
                onPreview={handlePreview}
                onEquipToggle={handleEquipToggle}
              />
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F6FA" },

  contentScroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // 미리보기 패널
  leftPanel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 8,
    marginTop: 40,
  },
  leftPanelWide: { flex: 1, minHeight: 360, marginRight: 8 },
  leftPanelNarrow: { width: "100%" },

  title: { fontSize: 18, fontWeight: "700" },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  characterCard: {
    borderRadius: 16,
    backgroundColor: "#FAFAFD",
    borderWidth: 1,
    borderColor: "#EEE",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tinoStage: {
    width: STAGE_W,
    height: STAGE_H,
    position: "relative",
    alignSelf: "center",
  },
  characterImage: {
    position: "absolute",
    left: 0,
    top: 0,
    width: STAGE_W,
    height: STAGE_H,
    resizeMode: "contain",
  },
  overlayWrap: {
    position: "absolute",
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayImage: { width: CELL_SIZE, height: CELL_SIZE, resizeMode: "contain" },

  // 오른쪽 패널
  rightPanel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  rightPanelWide: { flex: 1.2, marginLeft: 8 },
  rightPanelNarrow: { width: "100%", marginTop: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700" },
  tabBar: { flexDirection: "row" },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#F1F2F6" },
  tabBtnActive: { backgroundColor: "#2F80ED22", borderWidth: 1, borderColor: "#2F80ED" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#626773" },
  tabTextActive: { color: "#2F80ED" },

  // 카드
  cardThumb: { width: 40, height: 40, resizeMode: "contain" },
  itemCard: {
    flex: 1,
    backgroundColor: "#FAFAFD",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    marginHorizontal: 6,
  },
  itemCardActive: { borderColor: "#2F80ED" },
  itemTitle: { marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 8 },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  itemPrice: { fontSize: 13, fontWeight: "700", marginLeft: 4 },

  badgeOn: { backgroundColor: "#2F80ED", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeOff: { backgroundColor: "#D8DEE9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // 버튼
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F7",
  },
  secondaryBtnText: { marginLeft: 6, fontSize: 12, fontWeight: "700", color: "#394150" },

  equipBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2F80ED",
  },
  equipBtnOn: {
    backgroundColor: "#2F80ED",
    borderColor: "#2F80ED",
  },
  equipBtnText: { fontSize: 13, fontWeight: "700", color: "#2F80ED" },
});
