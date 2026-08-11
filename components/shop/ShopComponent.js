// components/shop/ShopComponent.js
import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  useWindowDimensions,
  ScrollView,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import PageTitleComponent from "../common/PageTitleComponent";
import { useNavigation } from "@react-navigation/native";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const CELL_SIZE = 70;
const STAGE_W = 260;
const STAGE_H = 260;
const OFFSET_X = 0;
const OFFSET_Y = 0;

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

const TABS = ["모자", "악세서리", "배경"];
const KO_TO_CATEGORY = { 모자: "HAT", 악세서리: "ACCESSORY", 배경: "BACKGROUND" };
const CATEGORY_TO_ICON = { HAT: "hat-fedora", ACCESSORY: "glasses", BACKGROUND: "image-area" };

const ShopItemCard = ({ item, onPreview, onBuy }) => {
  const { colors, isDark } = useTheme();

  const disabled = item.owned;
  const cannotAfford = item.cannotAfford;

  return (
    <ThemeView
      style={[
        styles.itemCard,
        {
          backgroundColor: isDark ? "#1E1E1E" : "#FAFAFD",
          borderColor: isDark ? "#333" : "#ECEEF2",
        },
      ]}
    >
      <TouchableOpacity onPress={() => onPreview(item)} activeOpacity={0.8}>
        {item.imageSrc ? (
          <Image source={item.imageSrc} style={styles.cardThumb} />
        ) : (
          <MaterialCommunityIcons
            name={item.icon}
            size={36}
            color={colors.text}
          />
        )}
      </TouchableOpacity>

      <ThemeText style={[styles.itemTitle, { color: colors.text }]}>
        {item.title}
      </ThemeText>

      <ThemeView
        style={[
          styles.priceRow,
          {
            backgroundColor: isDark ? "#2A2A2A" : "#F3F4F7",
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 3,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="currency-usd"
          size={15}
          color={colors.text}
        />
        <ThemeText style={[styles.itemPrice, { color: colors.text }]}>
          {item.price}
        </ThemeText>
      </ThemeView>

      <TouchableOpacity
        style={[
          styles.buyBtn,
          {
            backgroundColor: disabled
              ? isDark
                ? "#555"
                : "#CCD0D6"
              : cannotAfford
              ? isDark
                ? "#38527A"
                : "#9EBEF5"
              : "#2F80ED",
          },
        ]}
        onPress={() => onBuy(item)}
        disabled={disabled}
      >
        {item.owned ? (
          <>
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color="#fff"
            />
            <ThemeText style={styles.buyBtnText}>보유중</ThemeText>
          </>
        ) : (
          <>
            <Ionicons name="cart" size={16} color="#fff" />
            <ThemeText style={styles.buyBtnText}>구매</ThemeText>
          </>
        )}
      </TouchableOpacity>
    </ThemeView>
  );
};

const ShopComponent = () => {
  const navigation = useNavigation();
  const store = useUserStore();
  const { colors, isDark } = useTheme();

  const userId = store.user_id;
  const coin = store.coin;
  const setGlobalCoin = store.setter.setCoin;

  const [tab, setTab] = useState("모자");
  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overlayItem, setOverlayItem] = useState(null);
  const [ownedNos, setOwnedNos] = useState(new Set());

  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const numColumns = isWide ? 3 : 2;

  // 코인 동기화
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("mypage")
          .select("mp_coin")
          .eq("user_id", userId)
          .maybeSingle();

        if (!cancelled && !error && data) {
          setGlobalCoin(data.mp_coin ?? 0);
        }
      } catch (e) {
        console.error("coin sync error:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, setGlobalCoin]);

  // 내가 가진 아이템 번호들
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("user_items")
        .select("item_no")
        .eq("user_id", userId);

      if (!cancelled && Array.isArray(data)) {
        setOwnedNos(new Set(data.map((d) => Number(d.item_no))));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 상점 아이템 목록
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shop_items")
        .select("no, name, category, price, x, y");

      if (!cancel && Array.isArray(data)) {
        const mapped = data.map((r) => ({
          id: String(r.no),
          title: r.name,
          price: r.price,
          category: r.category,
          x: r.x ?? 0,
          y: r.y ?? 0,
          imageSrc: IMAGE_BY_DB_NAME[r.name] || null,
          icon: CATEGORY_TO_ICON[r.category] || "shopping",
        }));
        setDbItems(mapped);
      }
      setLoading(false);
    })();

    return () => {
      cancel = true;
    };
  }, []);

  const items = useMemo(() => {
    const cat = KO_TO_CATEGORY[tab];
    return dbItems
      .filter((it) => it.category === cat)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((it) => ({
        ...it,
        owned: ownedNos.has(Number(it.id)),
        cannotAfford: coin < it.price,
      }));
  }, [tab, dbItems, ownedNos, coin]);

  const handlePreview = (it) => setOverlayItem(it);

  const handleBuy = (item) => {
    Alert.alert(
      "구매 확인",
      `"${item.title}"을(를) ${item.price}에 구매하시겠어요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "구매",
          onPress: async () => {
            try {
              if (!userId) {
                Alert.alert("로그인이 필요합니다.");
                return;
              }
              const itemNo = Number(item.id);

              if (ownedNos.has(itemNo)) {
                Alert.alert("이미 보유 중입니다.");
                return;
              }

              if (coin < item.price) {
                Alert.alert("코인 부족", "코인이 부족합니다.");
                return;
              }

              await supabase.from("user_items").insert([
                {
                  user_id: userId,
                  item_no: itemNo,
                  category: item.category,
                  equipped: false,
                },
              ]);

              const newCoin = coin - item.price;

              const { data: upd } = await supabase
                .from("mypage")
                .update({ mp_coin: newCoin })
                .eq("user_id", userId)
                .select("mp_coin")
                .single();

              setGlobalCoin(upd?.mp_coin ?? newCoin);
              setOwnedNos((p) => new Set([...p, itemNo]));

              Alert.alert("구매 완료", "아이템 구매가 완료되었습니다.");
            } catch (e) {
              console.error(e);
              Alert.alert("오류", "구매 중 문제가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  return (
    <ThemeView style={[styles.screen, { backgroundColor: colors.background }]}>
        <PageTitleComponent title={"상점"}/>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.scrollContent,
          { flexDirection: isWide ? "row" : "column" },
        ]}
      >
        {/* LEFT : 캐릭터 미리보기 */}
        <ThemeView
          style={[
            styles.leftPanel,
            {
              backgroundColor: isDark ? "#1A1A1A" : "#fff",
              borderColor: isDark ? "#333" : "#EEE",
            },
            isWide ? styles.leftPanelWide : styles.leftPanelNarrow,
          ]}
        >
          <ThemeView style={styles.previewHeader}>
            <ThemeText style={[styles.previewTitle, { color: colors.text }]}>
              캐릭터 미리보기
            </ThemeText>
          </ThemeView>

          <ThemeView
          
            style={[
              styles.characterCard,
              {
                backgroundColor: isDark ? "#111" : "#FAFAFD",
                borderColor: isDark ? "#444" : "#EEE",
              },
            ]}
          >
            <View style={styles.tinoStage}>
              {/* 배경 아이템 */}
              {overlayItem &&
                overlayItem.category === "BACKGROUND" &&
                overlayItem.imageSrc && (
                  <Image
                    source={overlayItem.imageSrc}
                    style={styles.backgroundImage}
                  />
                )}

              {/* 캐릭터 */}
              <Image
                style={styles.characterImage}
                source={require("../../assets/tino.png")}
              />

              {/* 모자/악세서리 */}
              {overlayItem &&
                overlayItem.category !== "BACKGROUND" && (
                  <View
                    style={[
                      styles.overlayWrap,
                      {
                        left:
                          OFFSET_X + (overlayItem.x || 0) * CELL_SIZE,
                        top:
                          OFFSET_Y + (overlayItem.y || 0) * CELL_SIZE,
                        backgroundColor: "transparent",
                      },
                    ]}
                    pointerEvents="none"
                  >
                    {overlayItem.imageSrc ? (
                      <Image
                        source={overlayItem.imageSrc}
                        style={styles.overlayImage}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={overlayItem.icon || "shape"}
                        size={36}
                        color={colors.text}
                      />
                    )}
                  </View>
                )}
            </View>

            {overlayItem && (
              <TouchableOpacity
                style={[
                  styles.clearBtn,
                  { backgroundColor: isDark ? "#2A2A2A" : "#ECEFF5" },
                ]}
                onPress={() => setOverlayItem(null)}
              >
                <ThemeText
                  style={[styles.clearBtnText, { color: colors.text }]}
                >
                  미리보기 해제
                </ThemeText>
              </TouchableOpacity>
            )}
          </ThemeView>
        </ThemeView>

        {/* RIGHT : 상점 리스트 */}
        <ThemeView
          style={[
            styles.rightPanel,
            {
              backgroundColor: isDark ? "#1A1A1A" : "#fff",
              borderColor: isDark ? "#333" : "#EEE",
            },
            isWide ? styles.rightPanelWide : styles.rightPanelNarrow,
          ]}
        >
          <ThemeView style={styles.shopHeader}>
            <ThemeText style={[styles.shopTitle, { color: colors.text }]}>
              상점
            </ThemeText>

            <ThemeView
              style={[
                styles.coinBadge,
                {
                  backgroundColor: isDark ? "#2A2A2A" : "#F3F4F7",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="currency-usd"
                size={16}
                color={colors.text}
              />
              <ThemeText
                style={[styles.coinText, { color: colors.text }]}
              >
                보유: {coin}
              </ThemeText>
            </ThemeView>
          </ThemeView>

          {/* 탭 */}
          <ThemeView style={styles.tabBar}>
            {TABS.map((label, i) => {
              const active = tab === label;
              return (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: active
                        ? isDark
                          ? "#2F80ED33"
                          : "#2F80ED22"
                        : isDark
                        ? "#2A2A2A"
                        : "#F1F2F6",
                      borderColor: active ? "#2F80ED" : "transparent",
                      borderWidth: active ? 1 : 0,
                    },
                    i !== TABS.length - 1 && { marginRight: 8 },
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
          </ThemeView>

          {/* 아이템 리스트 */}
          <FlatList
            data={items}
            key={numColumns}
            keyExtractor={(it) => it.id}
            numColumns={numColumns}
            scrollEnabled={false}
            nestedScrollEnabled
            contentContainerStyle={{
              paddingVertical: 8,
              paddingHorizontal: 6,
            }}
            ItemSeparatorComponent={() => (
              <ThemeView style={{ height: 12 }} />
            )}
            renderItem={({ item }) => (
              <ShopItemCard
                item={item}
                onPreview={handlePreview}
                onBuy={handleBuy}
              />
            )}
          />
        </ThemeView>
      </ScrollView>
    </ThemeView>
  );
};

export default ShopComponent;

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // ───── 상단 헤더 ─────

  contentScroll: { flex: 1 },
  scrollContent: { padding: 16 },

  leftPanel: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  leftPanelWide: { flex: 1, marginRight: 8 },
  leftPanelNarrow: { width: "100%" },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  previewTitle: { fontSize: 16, fontWeight: "700" },

  characterCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 6,
  },

  tinoStage: {
    width: STAGE_W,
    height: STAGE_H,
    position: "relative",
    alignSelf: "center",
    marginTop : 40,
  },
  backgroundImage: {
    position: "absolute",
    left: 0,
    top: 0,
    width: STAGE_W,
    height: STAGE_H,
    resizeMode: "cover",
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

  clearBtn: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  clearBtnText: { fontSize: 12, fontWeight: "600" },

  rightPanel: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  rightPanelWide: { flex: 1.2, marginLeft: 8 },
  rightPanelNarrow: { width: "100%", marginTop: 4 },

  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  shopTitle: { fontSize: 18, fontWeight: "700" },

  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  coinText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  tabBar: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },

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
  cardThumb: { width: 40, height: 40, resizeMode: "contain" },

  itemTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  priceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  itemPrice: { fontSize: 13, fontWeight: "600", marginLeft: 4 },

  buyBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  buyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 6,
  },
});
