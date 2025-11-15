import React, { useEffect, useState, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from "../settings/theme/ThemeContext";

const TypingText = ({ fullText = "", speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef(null);
  const { colors } = useTheme(); // ← 테마 색상 가져오기

  useEffect(() => {
    if (!fullText || typeof fullText !== "string") return;

    setDisplayedText("");

    if (intervalRef.current) clearInterval(intervalRef.current);

    let index = 0;

    const start = () => {
      intervalRef.current = setInterval(() => {
        setDisplayedText((prev) => {
          const next = prev + fullText.charAt(index);
          index++;
          if (index >= fullText.length) clearInterval(intervalRef.current);
          return next;
        });
      }, speed);
    };

    const timeout = setTimeout(start, 50);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeout);
    };
  }, [fullText]);

  return (
    <Text style={[styles.answerText, { color: colors.text }]}>
      {displayedText}
    </Text>
  );
};

const styles = StyleSheet.create({
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default TypingText;
