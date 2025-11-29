// components/board/BoardUserProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import supabase from "../../supabase";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// 🔹 캐릭터 스테이지 설정 (옷장/상점과 동일 기준)
const CELL_SIZE = 70;
const STAGE_W = 260;
const STAGE_H = 260;
const OFFSET_X = 0;
const OFFSET_Y = 0;
const CATS = ["HAT", "ACCESSORY", "BACKGROUND"];

// 🔹 상점/옷장과 동일한 이미지 매핑
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

const BoardUserProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const {
    userId,
    profileImgUrl: initProfile,
    userName: initName,
    characterName: initChar,
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [profileImgUrl, setProfileImgUrl] = useState(initProfile || null);
  const [userName, setUserName] = useState(initName || "");
  const [characterName, setCharacterName] = useState(initChar || "");

  // 🔹 해당 유저가 현재 입고 있는 아이템들
  const [wearing, setWearing] = useState({
    HAT: null,
    ACCESSORY: null,
    BACKGROUND: null,
  });

  // ─────────────────────────────────────────────
  // 1) 기본 프로필(이름, 캐릭터 이름, 프로필 이미지) 로드
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    // 이미 다 넘어온 경우는 재조회 생략
    if (initProfile && initName && initChar) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("mypage")
          .select("mp_Name, profileimg, user(name)")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("❌ 게시판 프로필 조회 오류:", error);
          return;
        }

        if (data) {
          setCharacterName(data.mp_Name || "");
          setProfileImgUrl(
            data.profileimg && data.profileimg !== "EMPTY"
              ? data.profileimg
              : null
          );
          setUserName(data.user?.name || "");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, initProfile, initName, initChar]);

  // ─────────────────────────────────────────────
  // 2) 해당 유저가 입고 있는 코스튬(모자/악세/배경) 로드
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const fetchEquippedItems = async () => {
      try {
        const { data: uiRows, error: uiErr } = await supabase
          .from("user_items")
          .select("item_no, category, equipped")
          .eq("user_id", userId);

        if (uiErr) {
          console.error("❌ user_items 조회 오류:", uiErr);
          return;
        }
        if (!uiRows || uiRows.length === 0) {
          setWearing({ HAT: null, ACCESSORY: null, BACKGROUND: null });
          return;
        }

        const ids = [
          ...new Set(
            uiRows.map((r) => Number(r.item_no)).filter((v) => !!v)
          ),
        ];
        if (ids.length === 0) {
          setWearing({ HAT: null, ACCESSORY: null, BACKGROUND: null });
          return;
        }

        const { data: siRows, error: siErr } = await supabase
          .from("shop_items")
          .select("no, name, category, x, y")
          .in("no", ids);

        if (siErr) {
          console.error("❌ shop_items 조회 오류:", siErr);
          return;
        }

        const map = new Map(
          (siRows || []).map((s) => [Number(s.no), s])
        );

        // user_items + shop_items merge
        const merged = uiRows
          .map((u) => {
            const s = map.get(Number(u.item_no));
            if (!s) return null;
            return {
              id: String(s.no),
              title: s.name,
              category: s.category,
              x: s.x ?? 0,
              y: s.y ?? 0,
              imageSrc: IMAGE_BY_DB_NAME[s.name] || null,
              equipped: !!u.equipped,
            };
          })
          .filter(Boolean);

        const nextWear = { HAT: null, ACCESSORY: null, BACKGROUND: null };
        for (const it of merged) {
          if (it.equipped && CATS.includes(it.category)) {
            nextWear[it.category] = it;
          }
        }
        setWearing(nextWear);
      } catch (e) {
        console.error("❌ 코스튬 로드 오류:", e);
      }
    };

    fetchEquippedItems();
  }, [userId]);

  const avatarSource = profileImgUrl
    ? { uri: profileImgUrl }
    : require("../../assets/User.jpg");

  return (
    <ThemeView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 🔙 뒤로가기 버튼 */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={26} color={colors.text} />
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          size="large"
          style={styles.loading}
          color={colors.text}
        />
      )}

      {/* 프로필 사진 */}
      <Image source={avatarSource} style={styles.profileImage} />

      {/* 이름 / 캐릭터 이름 */}
      <ThemeText style={[styles.userName, { color: colors.text }]}>
        {userName || "이름 없음"}
      </ThemeText>
      <ThemeText style={[styles.charName, { color: colors.subText }]}>
        캐릭터 이름: {characterName || "-"}
      </ThemeText>

      {/* 🔥 꾸민 캐릭터 표시 영역 */}
      <ThemeView
        style={[
          styles.characterCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.tinoStage}>
          {/* 1) 배경 (있으면) */}
          {wearing.BACKGROUND && wearing.BACKGROUND.imageSrc && (
            <Image
              source={wearing.BACKGROUND.imageSrc}
              style={styles.backgroundImage}
            />
          )}

          {/* 2) 기본 티노 캐릭터 */}
          <Image
            source={require("../../assets/tino.png")}
            style={styles.characterImage}
            resizeMode="contain"
          />

          {/* 3) 모자 / 악세서리 오버레이 */}
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
                  },
                ]}
                pointerEvents="none"
              >
                {it.imageSrc ? (
                  <Image
                    source={it.imageSrc}
                    style={styles.overlayImage}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="shape"
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
  );
};

export default BoardUserProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 50, // 상태바 아래 적당히
    left: 20,
    zIndex: 10,
  },
  loading: {
    position: "absolute",
    top: 90,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  charName: {
    fontSize: 16,
    marginBottom: 20,
  },

  // 🔹 캐릭터 카드 + 스테이지
  characterCard: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingTop : 60,
  },
  tinoStage: {
    width: STAGE_W,
    height: STAGE_H,
    position: "relative",
    alignSelf: "center",
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
  },
});
