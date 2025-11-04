// components/QuestCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const QuestCard = ({ quest, onClaimPress }) => {
  if (!quest) return null;

  // quests 테이블 join 구조 반영
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
    ? "#bbb"
    : isCompleted
    ? "#ffd700"
    : "#ddd";

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{name}</Text>

        {/* 진행도 텍스트 */}
        <Text style={styles.progressText}>진행도: {progressText}</Text>

        {/* 초록색 진행도 바 */}
        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* 보상 코인 표시 */}
        <View style={styles.rewardRow}>
          <MaterialCommunityIcons name="currency-usd" size={18} color="gold" />
          <Text style={styles.rewardText}>{reward_coin} 코인</Text>
        </View>
      </View>

      {/* 보상 버튼 */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }]}
        disabled={buttonDisabled}
        onPress={() => onClaimPress(quest)}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default QuestCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  progressText: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
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
    color: "#333",
  },
});