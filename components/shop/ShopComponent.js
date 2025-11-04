// components/shop/ShopComponent.js
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";

// 좌표(칸 단위)
const CELL_SIZE = 70;
const STAGE_W = 260;
const STAGE_H = 250;
const OFFSET_X = 0;
const OFFSET_Y = 0;

// DB name → 로컬 이미지 매핑(파일이 실제로 있어야 함)
const IMAGE_BY_DB_NAME = {
  "black cap": require("../../assets/black cap.png"),
  "black sunglasses": require("../../assets/black sunglasses.png"),
  "black hair": require("../../assets/black hair.png"),
};

// 탭/카테고리
const TABS = ["모자", "악세서리", "배경"];
const KO_TO_CATEGORY = { 모자: "HAT", 악세서리: "ACCESSORY", 배경: "BACKGROUND" };
const CATEGORY_TO_ICON = { HAT: "hat-fedora", ACCESSORY: "glasses", BACKGROUND: "image-area" };

const ShopItemCard = ({ item, onPreview, onBuy }) => {
  const disabled = item.owned || item.cannotAfford;
  return (
    <TouchableOpacity style={styles.itemCard} onPress={() => onPreview(item)} activeOpacity={0.8}>
      {item.imageSrc ? (
        <Image source={item.imageSrc} style={styles.cardThumb} />
      ) : (
        <MaterialCommunityIcons name={item.icon} size={36} />
      )}

      <Text style={styles.itemTitle}>{item.title}</Text>

      <View style={styles.priceRow}>
        <MaterialCommunityIcons name="currency-usd" size={16} />
        <Text style={styles.itemPrice}>{item.price}</Text>
      </View>

      <TouchableOpacity
        style={[styles.buyBtn, disabled && { backgroundColor: "#C9CED6" }]}
        onPress={() => onBuy(item)}
        disabled={disabled}
      >
        {item.owned ? (
          <>
            <MaterialCommunityIcons name="check-circle" size={16} />
            <Text style={styles.buyBtnText}>보유중</Text>
          </>
        ) : (
          <>
            <Ionicons name="cart" size={16} />
            <Text style={styles.buyBtnText}>구매</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const ShopComponent = () => {
  const navigation = useNavigation();
  const store = useUserStore();
  const userId = store.user_id;
  const coin = store.coin;
  const setGlobalCoin = store.setCoin; // setter

  const [tab, setTab] = useState("모자");
  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overlayItem, setOverlayItem] = useState(null);
  const [ownedNos, setOwnedNos] = useState(new Set());

  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const numColumns = isWide ? 3 : 2;

  // 보유 아이템 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!userId) return;
        const { data, error } = await supabase.from("user_items").select("item_no").eq("user_id", userId);
        if (!cancelled && !error && Array.isArray(data)) {
          setOwnedNos(new Set(data.map((d) => Number(d.item_no))));
        }
      } catch (e) {
        console.log("loadOwned:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 상점 아이템 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("shop_items").select("no, name, category, price, x, y");
        if (error) {
          console.error("[shop_items] select error:", error);
          return;
        }
        if (!cancelled && Array.isArray(data)) {
          const mapped = data.map((r) => ({
            id: String(r.no),
            title: r.name,
            price: r.price,
            category: r.category,
            x: r.x ?? 0,
            y: r.y ?? 0,
            name: r.name,
            imageSrc: IMAGE_BY_DB_NAME[r.name] || null,
            icon: CATEGORY_TO_ICON[r.category] || "shopping",
          }));
          setDbItems(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 현재 탭 아이템 (보유/코인 상태 반영)
  const items = useMemo(() => {
    const cat = KO_TO_CATEGORY[tab];
    return dbItems
      .filter((it) => it.category === cat)
      .sort((a, b) => (a.y - b.y) || (a.x - b.x))
      .map((it) => ({
        ...it,
        owned: ownedNos.has(Number(it.id)),
        cannotAfford: coin < it.price,
      }));
  }, [tab, dbItems, ownedNos, coin]);

  // 미리보기
  const handlePreview = (it) => {
    setOverlayItem({ ...it, x: it?.x ?? 0, y: it?.y ?? 0 });
  };

  // 구매
  const handleBuy = (item) => {
    Alert.alert("구매 확인", `"${item.title}"를 ${item.price}원에 구매하시겠어요?`, [
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
            if (!itemNo || Number.isNaN(itemNo)) {
              Alert.alert("알림", "DB에 등록된 아이템만 구매할 수 있어요.");
              return;
            }
            if (ownedNos.has(itemNo)) {
              Alert.alert("알림", "이미 보유한 아이템입니다.");
              return;
            }
            if (coin < item.price) {
              Alert.alert("코인 부족", "보유 코인이 부족합니다.");
              return;
            }

            // 1) user_items에 추가
            const { error: insertErr } = await supabase.from("user_items").insert([
              {
                user_id: userId,
                item_no: itemNo,
                category: item.category,
                equipped: false,
              },
            ]);
            if (insertErr) {
              console.error("user_items insert error:", insertErr);
              Alert.alert("실패", "아이템 추가에 실패했어요.");
              return;
            }

            // 2) mypage 코인 차감 (서버의 mp_Coin과 동기화)
            const newCoin = coin - item.price;
            const { data: updated, error: coinErr } = await supabase
              .from("mypage")
              .update({ mp_Coin: newCoin })
              .eq("user_id", userId)
              .select("mp_Coin")
              .single();

            if (coinErr) {
              console.error("mypage coin update error:", coinErr);
              Alert.alert("오류", "코인 차감에 실패했습니다.");
              // (선택) 롤백: user_items 삭제 고려 가능
              return;
            }

            // 3) 전역 코인 상태 갱신
            const updatedCoinValue = (updated && updated.mp_Coin) ? Number(updated.mp_Coin) : newCoin;
            setGlobalCoin(updatedCoinValue);

            // 4) UI 반영
            setOwnedNos((prev) => new Set([...prev, itemNo]));
            Alert.alert("완료", "구매가 완료되었습니다.");
          } catch (e) {
            console.error(e);
            Alert.alert("실패", "구매 처리 중 오류가 발생했어요.");
          }
        },
      },
    ]);
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
            <Text style={styles.previewTitle}>캐릭터 미리보기</Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("MyPage"))}
            >
              <Ionicons name="chevron-back" size={20} color="#333" />
              <Text style={styles.backText}>뒤로</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.characterCard}>
            <View style={styles.tinoStage}>
              <Image style={styles.characterImage} source={require("../../assets/tino.png")} />
              {overlayItem && (
                <View
                  style={[
                    styles.overlayWrap,
                    {
                      left: OFFSET_X + (overlayItem.x || 0) * CELL_SIZE,
                      top: OFFSET_Y + (overlayItem.y || 0) * CELL_SIZE,
                    },
                  ]}
                  pointerEvents="none"
                >
                  {overlayItem.imageSrc ? (
                    <Image source={overlayItem.imageSrc} style={styles.overlayImage} />
                  ) : (
                    <MaterialCommunityIcons name={overlayItem.icon || "shape"} size={36} />
                  )}
                </View>
              )}
            </View>

            {overlayItem && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setOverlayItem(null)}>
                <Text style={styles.clearBtnText}>미리보기 해제</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 오른쪽: 상점 */}
        <View style={[styles.rightPanel, isWide ? styles.rightPanelWide : styles.rightPanelNarrow]}>
          <View style={styles.shopHeader}>
            <Text style={styles.shopTitle}>상점</Text>
            <View style={styles.coinBadge}>
              <MaterialCommunityIcons name="currency-usd" size={16} />
              <Text style={styles.coinText}>보유: {coin}</Text>
            </View>
          </View>

          {/* 탭 */}
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

          {/* 아이템 그리드 */}
          <FlatList
            data={items}
            key={numColumns}
            keyExtractor={(it) => it.id}
            numColumns={numColumns}
            scrollEnabled={false}
            nestedScrollEnabled
            contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 6 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => <ShopItemCard item={item} onPreview={handlePreview} onBuy={handleBuy} />}
            ListEmptyComponent={
              !loading ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Text>표시할 아이템이 없습니다.</Text>
                </View>
              ) : null
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default ShopComponent;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F6FA" },

  // 바깥 스크롤
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
    marginTop: 30,
  },
  leftPanelWide: { flex: 1, minHeight: 360, marginRight: 8 },
  leftPanelNarrow: { width: "100%" },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  previewTitle: { fontSize: 16, fontWeight: "600" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F7",
  },
  backText: { marginLeft: 4, fontSize: 13, fontWeight: "600", color: "#333" },

  characterCard: {
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "flex-start",
    justifyContent: "flex-start",
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
  clearBtn: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECEFF5",
  },
  clearBtnText: { fontSize: 12, fontWeight: "600", color: "#394150" },

  // 상점 패널
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
    backgroundColor: "#F3F4F7",
  },
  coinText: { fontSize: 13, fontWeight: "600", marginLeft: 6 },

  tabBar: { flexDirection: "row", marginTop: 8, marginBottom: 12 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#F1F2F6" },
  tabBtnActive: { backgroundColor: "#2F80ED22", borderWidth: 1, borderColor: "#2F80ED" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#626773" },
  tabTextActive: { color: "#2F80ED" },

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
  itemTitle: { marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center" },
  priceRow: { marginTop: 6, flexDirection: "row", alignItems: "center" },
  itemPrice: { fontSize: 13, fontWeight: "700", marginLeft: 4 },
  buyBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#2F80ED",
    borderRadius: 999,
  },
  buyBtnText: { fontSize: 12, color: "#fff", fontWeight: "700", marginLeft: 6 },
});
