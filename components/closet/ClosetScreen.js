import React, { useEffect, useMemo, useState } from "react";
import {
  View,
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
import { pushQuest } from "../quest/Quests"; // 그대로 둠
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const CELL_SIZE = 70;
const STAGE_W = 260;
const STAGE_H = 260;
const OFFSET_X = 0;
const OFFSET_Y = 0;

const TABS = ["모자", "악세서리", "배경"];
const KO_TO_CATEGORY = { 모자: "HAT", 악세서리: "ACCESSORY", 배경: "BACKGROUND" };
const CATEGORY_TO_ICON = { HAT: "hat-fedora", ACCESSORY: "glasses", BACKGROUND: "image-area" };
const CATS = ["HAT", "ACCESSORY", "BACKGROUND"];

// ✅ 상점과 동일하게 이미지 매핑
const IMAGE_BY_DB_NAME = {
  "black cap": require("../../assets/black cap.png"),
  "black sunglasses": require("../../assets/black sunglasses.png"),
  "black hair": require("../../assets/black hair.png"),
  BlackBowTie: require("../../assets/BlackBowTie.png"),
  DollarChain: require("../../assets/DollarChain.png"),
  WavyPattern: require("../../assets/WavyPattern.png"),
  YellowBalloon: require("../../assets/YellowBalloon.png"),
  YellowSchoolHat: require("../../assets/YellowSchoolHat.png"),
  CityNightSky: require("../../assets/CityNightSky.png"),
  PastelSunsetBackground: require("../../assets/PastelSunsetBackground.png"),
};

const ClosetItemCard = ({ item, selected, onPreview, onEquipToggle, colors }) => {
  return (
    <TouchableOpacity
      style={[
        styles.itemCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: "#2F80ED" },
      ]}
      onPress={() => onPreview(item)}
    >
      {item.imageSrc ? (
        <Image source={item.imageSrc} style={styles.cardThumb} />
      ) : (
        <MaterialCommunityIcons name={item.icon} size={36} color={colors.text} />
      )}
      <ThemeText style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
        {item.title}
      </ThemeText>

      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <MaterialCommunityIcons name="currency-usd" size={14} color={colors.text} />
          <ThemeText style={[styles.itemPrice, { color: colors.text }]}>{item.price}</ThemeText>
        </View>

        <View
          style={[
            selected ? styles.badgeOn : styles.badgeOff,
            { backgroundColor: selected ? "#2F80ED" : colors.subBackground },
          ]}
        >
          <ThemeText style={[styles.badgeText, { color: "#fff" }]}>
            {selected ? "입힘" : "입혀보기"}
          </ThemeText>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.equipBtn,
          item.equipped && styles.equipBtnOn,
          { borderColor: "#2F80ED" },
        ]}
        onPress={() => onEquipToggle(item)}
      >
        <ThemeText
          style={[
            styles.equipBtnText,
            { color: item.equipped ? "#fff" : "#2F80ED" },
          ]}
        >
          {item.equipped ? "해제" : "장착"}
        </ThemeText>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function ClosetScreen() {
  const navigation = useNavigation();
  const { user_id: userId } = useUserStore();
  const { colors } = useTheme();

  const [tab, setTab] = useState("모자");
  const [ownedItems, setOwnedItems] = useState([]);
  const [wearing, setWearing] = useState({ HAT: null, ACCESSORY: null, BACKGROUND: null });
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const numColumns = isWide ? 3 : 2;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!userId) return;
        setLoading(true);

        const { data: uiRows } = await supabase
          .from("user_items")
          .select("item_no, category, equipped")
          .eq("user_id", userId);

        if (!uiRows?.length) {
          if (!cancelled) setOwnedItems([]);
          return;
        }

        const ids = [...new Set(uiRows.map((r) => Number(r.item_no)).filter(Boolean))];
        const { data: siRows } = await supabase
          .from("shop_items")
          .select("no, name, category, price, x, y")
          .in("no", ids);

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
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const listItems = useMemo(() => {
    const cat = KO_TO_CATEGORY[tab];
    return ownedItems
      .filter((it) => it.category === cat)
      .sort((a, b) => a.y - b.y || a.x - b.x);
  }, [tab, ownedItems]);

  const handlePreview = (item) => {
    setWearing((prev) => ({ ...prev, [item.category]: item }));
  };

  const handleEquipToggle = async (item) => {
    try {
      if (!userId) return;
      const itemNo = Number(item.id);
      if (!itemNo) return;

      if (item.equipped) {
        await supabase
          .from("user_items")
          .update({ equipped: false })
          .eq("user_id", userId)
          .eq("item_no", itemNo);

        setOwnedItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, equipped: false } : it
          )
        );
        setWearing((prev) => ({ ...prev, [item.category]: null }));
        return;
      }

      await supabase
        .from("user_items")
        .update({ equipped: false })
        .eq("user_id", userId)
        .eq("category", item.category);

      await supabase
        .from("user_items")
        .update({ equipped: true })
        .eq("user_id", userId)
        .eq("item_no", itemNo);

      setOwnedItems((prev) =>
        prev.map((it) =>
          it.category === item.category
            ? { ...it, equipped: it.id === item.id }
            : it
        )
      );
      setWearing((prev) => ({
        ...prev,
        [item.category]: { ...item, equipped: true },
      }));

      await supabase.rpc("update_quest_progress", {
        p_quest_no: 6,
        p_user_id: userId,
      });

      console.log("🎯 코스튬 변경 완료 및 퀘스트 갱신");
    } catch (e) {
      console.error("❌ equip toggle error:", e);
    }
  };

  return (
    <ThemeView style={[styles.screen, { backgroundColor: colors.background }]}>

      {/* 🔹 상단 헤더: 뒤로가기 + 로고 + 옷장 */}
      <ThemeView
        style={[
          styles.topHeader,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={require("../../assets/main_logo.jpeg")}
            style={styles.headerLogo}
          />
          <ThemeText
            style={[styles.headerTitleText, { color: colors.text }]}
          >
            옷장
          </ThemeText>
        </View>

        <View style={styles.headerRightSpacer} />
      </ThemeView>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.scrollContent,
          { flexDirection: isWide ? "row" : "column" },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Left panel */}
        <ThemeView
          style={[
            styles.leftPanel,
            { backgroundColor: colors.card, borderColor: colors.border },
            isWide ? styles.leftPanelWide : styles.leftPanelNarrow,
          ]}
        >
          <ThemeView style={styles.previewHeader}>
            <ThemeText style={[styles.title, { color: colors.text }]}>
              캐릭터 미리보기
            </ThemeText>
            <View style={styles.rowCenter}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: colors.subBackground }]}
                onPress={() => navigation.navigate("Shop")}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={16}
                  color={colors.text}
                />
                <ThemeText
                  style={[styles.secondaryBtnText, { color: colors.text }]}
                >
                  상점 가기
                </ThemeText>
              </TouchableOpacity>
            </View>
          </ThemeView>

          <ThemeView
            style={[
              styles.characterCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* 🔹 여기! 카드(창) 전체를 기준으로 배경 깔기 */}
            {wearing.BACKGROUND && wearing.BACKGROUND.imageSrc && (
              <Image
                source={wearing.BACKGROUND.imageSrc}
                style={styles.backgroundImage}
                resizeMode="cover"
                pointerEvents="none"
              />
            )}

            <View style={styles.tinoStage}>
              {/* 캐릭터 */}
              <Image
                style={styles.characterImage}
                source={require("../../assets/tino.png")}
              />

              {/* 모자 & 악세서리 */}
              {["HAT", "ACCESSORY"].map((cat) => {
                const it = wearing[cat];
                if (!it) return null;
                return (
                  <View
                    key={cat}
                    style={[
                      styles.overlayWrap,
                      {
                        left: OFFSET_X + (it.x || 0) * CELL_SIZE,
                        top: OFFSET_Y + (it.y || 0) * CELL_SIZE,
                        backgroundColor: "transparent",
                      },
                    ]}
                    pointerEvents="none"
                  >
                    {it.imageSrc ? (
                      <Image
                        source={it.imageSrc}
                        style={[styles.overlayImage, { backgroundColor: "transparent" }]}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={it.icon}
                        size={36}
                        color={colors.text}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </ThemeView>
        </ThemeView>

        {/* Right panel */}
        <ThemeView
          style={[
            styles.rightPanel,
            { backgroundColor: colors.card, borderColor: colors.border },
            isWide ? styles.rightPanelWide : styles.rightPanelNarrow,
          ]}
        >
          <View style={styles.rowBetween}>
            <ThemeText style={[styles.sectionTitle, { color: colors.text }]}>
              내 아이템
            </ThemeText>
            <View style={styles.tabBar}>
              {TABS.map((label, idx) => {
                const active = tab === label;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.tabBtn,
                      {
                        backgroundColor: active ? "#2F80ED22" : colors.subBackground,
                        borderColor: active ? "#2F80ED" : colors.border,
                        borderWidth: active ? 1 : 0,
                      },
                      idx !== TABS.length - 1 && { marginRight: 8 },
                    ]}
                    onPress={() => setTab(label)}
                  >
                    <ThemeText
                      style={[
                        styles.tabText,
                        { color: active ? "#2F80ED" : colors.text },
                      ]}
                    >
                      {label}
                    </ThemeText>
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
                  <ThemeText style={{ color: colors.subText }}>
                    이 카테고리에 아이템이 없어요.
                  </ThemeText>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <ClosetItemCard
                item={item}
                selected={wearing[item.category]?.id === item.id}
                onPreview={handlePreview}
                onEquipToggle={handleEquipToggle}
                colors={colors}
              />
            )}
          />
        </ThemeView>
      </ScrollView>
    </ThemeView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // 🔹 상단 헤더 공통 (상점과 동일 느낌)
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
    alignItems: "left",
    justifyContent: "left",
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
    marginTop: 6,
  },
  headerRightSpacer: {
    width: 30,
  },

  contentScroll: { flex: 1 },
  scrollContent: { padding: 16 },

  leftPanel: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    marginTop: 12, // 헤더 생겼으니 여백 줄임
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
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingTop: 40,
    overflow: "hidden", // 카드 밖 잘라주기
  },

  tinoStage: {
    width: STAGE_W,
    height: STAGE_H,
    position: "relative",
    alignSelf: "center",
  },

  // 🔹 배경: 카드(창) 전체를 덮도록
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
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
  overlayImage: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    resizeMode: "contain",
    backgroundColor: "transparent",
  },

  rightPanel: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  rightPanelWide: { flex: 1.2, marginLeft: 8 },
  rightPanelNarrow: { width: "100%", marginTop: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700" },
  tabBar: { flexDirection: "row" },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  tabText: { fontSize: 13, fontWeight: "600" },

  cardThumb: { width: 40, height: 40, resizeMode: "contain" },
  itemCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
    borderWidth: 1,
    marginHorizontal: 6,
  },
  itemTitle: { marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center" },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  rowCenter: { flexDirection: "row", alignItems: "center" },

  itemPrice: { fontSize: 13, fontWeight: "700", marginLeft: 4 },

  badgeOn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeOff: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  secondaryBtnText: { marginLeft: 6, fontSize: 12, fontWeight: "700" },

  equipBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  equipBtnOn: { backgroundColor: "#2F80ED", borderColor: "#2F80ED" },
  equipBtnText: { fontSize: 13, fontWeight: "700" },
});
