// components/QuestCard.js
import React from "react";
import { TouchableOpacity, StyleSheet, View, Platform } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const QuestCard = ({ quest, onClaimPress }) => {
  const { colors } = useTheme();

  if (!quest) return null;

  const name = quest.quests?.name || "이름 없음";
  const goal_count = quest.quests?.goal_count || 0;
  const reward_coin = quest.quests?.reward_coin || 0;
  const current_count = quest.current_count || 0;
  const is_cleared = quest.is_cleared || false;
  const claimed_at = quest.claimed_at || null;

  const progress = Math.min(current_count, goal_count) / (goal_count || 1);
  const progressText = `${Math.min(current_count, goal_count)}/${goal_count}`;
  const isReceived = Boolean(claimed_at);
  const isCompleted = is_cleared && !isReceived;

  const buttonText = isReceived ? "수령 완료" : isCompleted ? "보상 받기" : "진행 중";
  const buttonDisabled = isReceived || !isCompleted;

  const buttonColor = isReceived
    ? colors.subBackground
    : isCompleted
    ? "#ffd700"
    : colors.border;

  return (
    <ThemeView
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      <ThemeView style={styles.info}>
        <ThemeText style={[styles.title, { color: colors.text }]}>{name}</ThemeText>

        {/* 진행도 텍스트 */}
        <ThemeText style={[styles.progressText, { color: colors.subText }]}>
          진행도: {progressText}
        </ThemeText>

        {/* 진행도 바 */}
        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* 보상 코인 */}
        <View style={styles.rewardRow}>
          <MaterialCommunityIcons name="currency-usd" size={18} color="gold" />
          <ThemeText style={styles.rewardText}>{reward_coin} 코인</ThemeText>
        </View>
      </ThemeView>

      {/* 보상 버튼 */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }]}
        disabled={buttonDisabled}
        onPress={() => onClaimPress(quest)}
      >
        <ThemeText style={[styles.buttonText, { color: isCompleted ? "#333" : colors.text }]}>
          {buttonText}
        </ThemeText>
      </TouchableOpacity>
    </ThemeView>
  );
};

export default QuestCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // ✅ 배경과의 경계
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    ...Platform.select({
      android: {
        elevation: 4, // Android용 경계 보강
      },
      ios: {
        shadowOpacity: 0.25, // iOS용 경계 보강
      },
    }),
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressText: {
    marginTop: 6,
    fontSize: 13,
  },
  progressBarWrapper: {
    width: "100%",
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 6,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4ade80", // 초록색
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "goldenrod",
    marginLeft: 4,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
