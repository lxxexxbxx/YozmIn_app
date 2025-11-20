import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Entypo from "react-native-vector-icons/Entypo";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";
import ImageUploader from "../../Images/ImageUploader";

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
    const { data: progress, error } = await supabase
      .from("quest_progress_daily")
      .select("no")
      .eq("user_id", uid)
      .eq("quest_no", 1)
      .eq("quest_date", today);

    if (error) {
      console.warn("로그인 퀘스트 조회 실패:", error.message);
      return;
    }

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
  const route = useRoute();
  const { colors } = useTheme();

  // 로그인한 내 정보
  const storeUserId = useUserStore((s) => s.user_id);
  const storeUserName = useUserStore((s) => s.name);

  // 게시판에서 들어왔는지 여부 + 어떤 유저를 보는지
  const params = route.params || {};
  const isFromBoard = !!params.readOnly && !!params.userId; // 상태 1
  const viewedUserId = isFromBoard && params.userId ? params.userId : storeUserId; // 실제 조회 대상
  const isLimitedView = isFromBoard; // 읽기 전용 모드 여부

  // 헤더 오른쪽에 보여줄 회원 이름(user.name)
  const [headerName, setHeaderName] = useState(storeUserName || "");

  // 프로필 이미지 URL (mypage.profileimg)
  const [profileImgUrl, setProfileImgUrl] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const profileUploaderRef = useRef(null);

  // 캐릭터 / 코인 / 착용 아이템
  const [coin, setCoin] = useState(0);
  const [characterName, setCharacterName] = useState(""); // 티노 위 캐릭터 이름(mp_Name)
  const [level, setLevel] = useState(0);
  const [wearing, setWearing] = useState({
    HAT: null,
    ACCESSORY: null,
    BACKGROUND: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const channelRef = useRef(null);

  // ─────────────────────────────
  // 캐릭터 + 회원 이름 + 프로필 이미지 같이 불러오기
  // (mypage + user.name 조인)
  // ─────────────────────────────
  const fetchCharacterData = useCallback(
    async (uid) => {
      try {
        console.log("▶ fetchCharacterData uid:", uid);
        const { data, error } = await supabase
          .from("mypage")
          .select("mp_Name, mp_Level, mp_coin, profileimg, user(name)")
          .eq("user_id", uid)
          .maybeSingle();

        console.log("▶ mypage data:", data, error);

        if (error) {
          console.error("데이터 조회 실패:", error);
          Alert.alert("오류", "마이페이지 데이터를 불러오는 데 실패했습니다.");
          return;
        }

        if (!data) {
          setCharacterName("");
          setLevel(0);
          setCoin(0);
          setHeaderName("");
          setProfileImgUrl(null);
          return;
        }

        // 캐릭터 정보
        setCharacterName(data.mp_Name ?? "");
        setLevel(Number(data.mp_Level ?? 0));
        setCoin(Number(data.mp_coin ?? 0));

        // 프로필 이미지
        const dbProfile = data.profileimg;
        setProfileImgUrl(dbProfile && dbProfile !== "EMPTY" ? dbProfile : null);

        // user 테이블에서 조인된 이름
        const joinedUserName = data.user?.name || "";

        // 내 마이페이지(상태 0)일 때는 스토어 이름 우선
        if (!isFromBoard && uid === storeUserId) {
          setHeaderName(storeUserName || joinedUserName || "");
        } else {
          // 게시판에서 들어온 경우(상태 1) → 그 유저의 user.name
          setHeaderName(joinedUserName || "");
        }
      } catch (e) {
        console.error("캐릭터 데이터 조회 예외:", e);
        Alert.alert("오류", "마이페이지 데이터를 불러오는 중 문제가 발생했습니다.");
      }
    },
    [isFromBoard, storeUserId, storeUserName]
  );

  // ─────────────────────────────
  // 착용 아이템 불러오기
  // ─────────────────────────────
  const fetchEquippedItems = useCallback(async (uid) => {
    try {
      const { data: uiRows, error } = await supabase
        .from("user_items")
        .select("item_no, category, equipped")
        .eq("user_id", uid)
        .eq("equipped", true);

      if (error) {
        console.log("착용 아이템 조회 오류:", error);
        return;
      }

      if (!uiRows?.length) {
        setWearing({ HAT: null, ACCESSORY: null, BACKGROUND: null });
        return;
      }

      const ids = [...new Set(uiRows.map((r) => Number(r.item_no)).filter(Boolean))];

      const { data: siRows, error: siErr } = await supabase
        .from("shop_items")
        .select("no, name, category, x, y")
        .in("no", ids);

      if (siErr) {
        console.log("shop_items 조회 오류:", siErr);
        return;
      }
      if (!siRows) return;

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

        if (CATS.includes(item.category)) {
          nextWear[item.category] = item;
        }
      });

      setWearing(nextWear);
    } catch (e) {
      console.log("착용 아이템 조회 예외:", e);
    }
  }, []);

  // ─────────────────────────────
  // 새로고침 (viewedUserId 기준)
  // ─────────────────────────────
  const refreshAll = useCallback(async () => {
    if (!viewedUserId) return;
    try {
      setRefreshing(true);
      await Promise.all([
        fetchCharacterData(viewedUserId),
        fetchEquippedItems(viewedUserId),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [viewedUserId, fetchCharacterData, fetchEquippedItems]);

  // ─────────────────────────────
  // 최초 로드
  // ─────────────────────────────
  useEffect(() => {
    console.log(
      "▶ MyPage storeUserId:",
      storeUserId,
      "viewedUserId:",
      viewedUserId,
      "isFromBoard:",
      isFromBoard
    );

    if (!viewedUserId) return;

    // 캐릭터/아이템/이름/코인/프로필
    refreshAll();

    // 내 마이페이지(상태 0)일 때만 로그인 퀘스트
    if (!isLimitedView && storeUserId) {
      updateQuest_Login(storeUserId);
    }
  }, [viewedUserId, isFromBoard, isLimitedView, storeUserId, refreshAll]);

  // ─────────────────────────────
  // 실시간 변경 반영 (viewedUserId 기준)
  // ─────────────────────────────
  useEffect(() => {
    if (!viewedUserId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const ch = supabase
      .channel(`mypage-live-${viewedUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mypage",
          filter: `user_id=eq.${viewedUserId}`,
        },
        () => {
          // mypage 변경 → 캐릭터/코인/이름/프로필 다시 가져오기
          fetchCharacterData(viewedUserId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_items",
          filter: `user_id=eq.${viewedUserId}`,
        },
        () => fetchEquippedItems(viewedUserId)
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
  }, [viewedUserId, fetchCharacterData, fetchEquippedItems]);

  // ─────────────────────────────
  // 상태 0으로 초기화: 화면에서 빠져나갈 때 readOnly/유저ID 리셋
  // ─────────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      navigation.setParams({
        userId: storeUserId, // 내 ID
        readOnly: false,     // 상태 0
      });
    });

    return unsubscribe;
  }, [navigation, storeUserId]);

  // ─────────────────────────────
  // 프로필 이미지 변경 핸들러 (상태 0 + 내 마이페이지일 때만)
  // ─────────────────────────────
  const handleProfilePress = () => {
    if (isLimitedView) return;                 // 상태 1(게시판에서 들어온) → 막기
    if (!storeUserId || viewedUserId !== storeUserId) return; // 내 페이지만 가능
    setProfileModalVisible(true);
  };

  const handleProfileUploadSuccess = async (url) => {
    try {
      setIsUploadingProfile(true);

      // DB 업데이트
      const { error } = await supabase
        .from("mypage")
        .update({ profileimg: url })
        .eq("user_id", storeUserId);

      if (error) throw error;

      // 상태 반영
      setProfileImgUrl(url);
      Alert.alert("완료", "프로필 이미지가 변경되었습니다.");
      setProfileModalVisible(false);
    } catch (e) {
      console.error("프로필 이미지 업데이트 실패:", e);
      Alert.alert("오류", "프로필 이미지를 저장하는 중 문제가 발생했습니다.");
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const avatarSource = profileImgUrl
    ? { uri: profileImgUrl }
    : require("../../assets/User.jpg");

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.subBackground }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {/* 상태 0 + 내 마이페이지일 때만 변경 가능 */}
          <TouchableOpacity
            disabled={isLimitedView || viewedUserId !== storeUserId}
            onPress={handleProfilePress}
          >
            <Image style={styles.profileImage} source={avatarSource} />
          </TouchableOpacity>

          <View>
            {/* 프로필 오른쪽 이름: user 테이블 name */}
            <ThemeText style={styles.username}>{headerName}</ThemeText>
            <ThemeText style={[styles.level, { color: colors.subText }]}>
              Lv. {level}
            </ThemeText>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* 읽기 전용 모드(게시판에서 온 상태 1)에서는 설정/북마크 숨김 */}
          {!isLimitedView && (
            <>
              <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")}>
                <Ionicons
                  name="settings"
                  size={24}
                  color={colors.text}
                  style={styles.iconSpacing}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Bookmark")}>
                <Ionicons
                  name="bookmark"
                  size={24}
                  color={colors.text}
                  style={styles.iconSpacing}
                />
              </TouchableOpacity>
            </>
          )}

          {/* 새로고침 버튼은 항상 표시 */}
          <TouchableOpacity onPress={refreshAll}>
            <Ionicons name={refreshing ? "reload" : "refresh"} size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 캐릭터 카드 */}
      <View style={[styles.characterBox, { backgroundColor: colors.boxBackground }]}>
        <View style={styles.characterHeader}>
          {/* 티노 위 이름: mp_Name (캐릭터 이름) */}
          <ThemeText style={styles.characterTitle}>{characterName}</ThemeText>
          <MaterialCommunityIcons name="currency-usd" size={24} color="gold" />
          <ThemeText style={[styles.money, { color: colors.text }]}>
            {Number.isFinite(Number(coin)) ? Number(coin) : 0} 원
          </ThemeText>
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
                  {
                    left: OFFSET_X + (it.x || 0) * CELL_SIZE,
                    top: OFFSET_Y + (it.y || 0) * CELL_SIZE,
                  },
                ]}
                pointerEvents="none"
              >
                {it.imageSrc ? <Image source={it.imageSrc} style={styles.overlayImage} /> : null}
              </View>
            );
          })}
        </View>

        {/* 하단 메뉴 - 읽기 전용(상태 1)에서는 숨김 */}
        {!isLimitedView && (
          <View style={styles.bottomNav}>
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={() => navigation.navigate("Shop")}>
                <Entypo
                  name="shop"
                  size={24}
                  color={colors.text}
                  style={styles.iconSpacing}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("SelectCategory")}>
                <Ionicons
                  name="grid"
                  size={24}
                  color={colors.text}
                  style={styles.iconSpacing}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("closet")}>
                <MaterialCommunityIcons name="wardrobe" size={24} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("TodayQuests")}>
                <MaterialCommunityIcons
                  name="script-text-outline"
                  size={26}
                  color={colors.text}
                  style={{ marginLeft: 10 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 프로필 이미지 변경 모달 (상태 0 + 내 페이지일 때만 띄움) */}
      {!isLimitedView && viewedUserId === storeUserId && (
        <Modal
          visible={profileModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => !isUploadingProfile && setProfileModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => !isUploadingProfile && setProfileModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>

              <ThemeText style={styles.modalTitle}>프로필 이미지 변경</ThemeText>

              <View style={styles.modalImageBox}>
                {profileImgUrl ? (
                  <Image source={{ uri: profileImgUrl }} style={styles.modalImage} />
                ) : (
                  <Image
                    source={require("../../assets/User.jpg")}
                    style={styles.modalImage}
                  />
                )}
                {isUploadingProfile && (
                  <ActivityIndicator style={styles.modalSpinner} size="large" />
                )}
              </View>

              <ImageUploader
                ref={profileUploaderRef}
                onUploadSuccess={handleProfileUploadSuccess}
                onUploadStart={() => setIsUploadingProfile(true)}
                onUploadEnd={() => setIsUploadingProfile(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </ThemeView>
  );
};

export default MyPageComponent;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
  profileInfo: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  username: { fontSize: 18, fontWeight: "bold" },
  level: { fontSize: 14 },
  headerRight: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  iconSpacing: { marginRight: 10 },

  characterBox: { padding: 20, borderRadius: 20, alignItems: "center", marginTop: 40 },
  characterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  money: { fontSize: 18, fontWeight: "bold", textDecorationLine: "underline", marginLeft: 5 },
  characterTitle: { fontSize: 18, fontWeight: "bold", marginRight: 8 },

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

  bottomNav: { flexDirection: "row", justifyContent: "flex-end", width: "100%", marginTop: 10 },
  iconRow: { flexDirection: "row", alignItems: "center" },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalImageBox: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalSpinner: {
    position: "absolute",
  },
});
