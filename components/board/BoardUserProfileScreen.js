// components/board/BoardUserProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import supabase from "../../supabase";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

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
  }, [userId]);

  const avatarSource = profileImgUrl
    ? { uri: profileImgUrl }
    : require("../../assets/User.jpg");

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 🔙 뒤로가기 버튼 */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={26} color={colors.text} />
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" style={styles.loading} color={colors.text} />
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

      {/* 🔥 캐릭터 이미지 사이즈 업 */}
      <Image
        source={require("../../assets/tino.png")}
        style={styles.characterImage}
        resizeMode="contain"
      />
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
    top: 50,   // 상태바 아래 적당히
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
    marginBottom: 28,
  },
  // ⬇️ 캐릭터 이미지 크게!
  characterImage: {
    width: 280,      // 기존보다 크게
    height: 280,
  },
});
