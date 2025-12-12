import React, { useEffect, useState, useRef } from "react";
import { StyleSheet } from "react-native";
import {ThemeText} from "../common/ThemeComponents";
import {useTheme} from "../settings/theme/ThemeContext";

const TypingText = ({ fullText = '', speed = 30, textColor }) => {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef(null);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (typeof fullText !== 'string' || fullText.length === 0) return;

    setDisplayedText(''); // 먼저 초기화

    // 이전 interval 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let index = 0;

    // 1 프레임 지연 후 시작
    const startTyping = () => {
      intervalRef.current = setInterval(() => {
        setDisplayedText((prev) => {
          const next = prev + fullText.charAt(index);
          index++;
          if (index >= fullText.length) {
            clearInterval(intervalRef.current);
          }
          return next;
        });
      }, speed);
    };

    const timeout = setTimeout(startTyping, 50);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeout);
    };
  }, [fullText]);

  return (
      <ThemeText style={[styles.answerText, {color: textColor ? textColor : colors.text}]}>{displayedText ?? ""}</ThemeText>
  );
};

const styles = StyleSheet.create({
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default TypingText;
