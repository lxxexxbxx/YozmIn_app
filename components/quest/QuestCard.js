// components/QuestCard.js
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function QuestCard({
  title,
  current,
  goal,
  reward,
  claimedAt,       // null | string
  onAddPress,      // () => void
  onClaimPress,    // () => void
}) {
  const progress = Math.min(current / goal, 1);
  const done = current >= goal;
  const claimed = !!claimedAt;

  return (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.title}>{title}</Text>
        <View style={s.rewardChip}>
          <Text style={s.rewardTxt}>💰 {reward}</Text>
        </View>
      </View>

      <View style={s.progressOuter}>
        <View style={[s.progressInner, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={s.countTxt}>
        {current} / {goal}
      </Text>

      <View style={s.btnRow}>
        <Pressable style={[s.btn, s.ghost]} onPress={onAddPress}>
          <Text style={[s.btnTxt, { color: "#2563eb" }]}>+1</Text>
        </Pressable>

        <Pressable
          style={[
            s.btn,
            done && !claimed ? s.primary : s.disabled,
            claimed && s.claimed,
          ]}
          onPress={onClaimPress}
          disabled={!done || claimed}
        >
          <Text style={s.btnTxt}>
            {claimed ? "수령 완료" : done ? "보상 받기" : "진행 중"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#FAFAFD",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  rewardChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 999,
  },
  rewardTxt: { fontWeight: "700", color: "#b45309" },
  progressOuter: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  progressInner: { height: "100%", backgroundColor: "#22c55e" },
  countTxt: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  btnRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 10 },
  btn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  ghost: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe" },
  primary: { backgroundColor: "#2563eb" },
  disabled: { backgroundColor: "#9ca3af" },
  claimed: { backgroundColor: "#10b981" },
  btnTxt: { color: "#fff", fontWeight: "700" },
});
