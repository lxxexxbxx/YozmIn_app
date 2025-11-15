import React, { useEffect, useRef, useState } from "react";
import {
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  View,
} from "react-native";
import { CommonUtils } from "../common/CommonUtils";
import TypingText from "./TypingText";
import { useUserStore } from "../../stores/UserStore";
import { useKeyStore } from "../../stores/KeyStore";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const { height } = Dimensions.get("window");

const ChatBotComponent = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  const userStore = useUserStore();
  const keyStore = useKeyStore();
  const { colors, isDark } = useTheme();

  const getTime = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input.trim(), time: getTime() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const response = await CommonUtils.fetchChatGPT(input);
    const botMessage = { role: "llm", text: response, time: getTime() };
    setMessages((prev) => [...prev, botMessage]);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = (msg, idx) => {
    const isLLM = msg.role === "llm";
    const isLast = idx === messages.length - 1 && isLLM;


    const bubbleColor = isLLM
      ? isDark
        ? "#4C4C4C"
        : "#EAEAEA"
      : isDark
      ? "#333333"
      : "#DCF8C6";

    return (
      <View
        key={idx}
        style={[
          styles.bubbleContainer,
          {
            alignSelf: isLLM ? "flex-start" : "flex-end",
            backgroundColor: bubbleColor,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isDark ? "#999" : "#DDD",
          },
        ]}
      >
        {isLast ? (
          <TypingText fullText={msg.text} speed={25} textColor={colors.text} />
        ) : (
          <ThemeText style={[styles.messageText, { color: colors.text }]}>
            {msg.text}
          </ThemeText>
        )}

        <ThemeText style={[styles.timeText, { color: colors.subText }]}>
          {msg.time}
        </ThemeText>
      </View>
    );
  };

  const init = async () => {
    if (userStore.name && keyStore.GOOGLE_API_KEY) {
      const prompt = `
      사용자명: ${userStore.name}
      오늘의 날씨와 주요 뉴스를 간단히 알려줘.
      `;
      const response = await CommonUtils.fetchChatGPT(prompt);
      const botMessage = { role: "llm", text: response, time: getTime() };
      setMessages((prev) => [...prev, botMessage]);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <ThemeView
      style={[
        styles.inner,
        {
          backgroundColor: isDark ? "#121212" : "#FFFFFF", // 홈 전체 배경
        },
      ]}
    >
      {/* 🔥 채팅 배경 전체를 회색으로 설정 */}
      <ScrollView
        ref={scrollRef}
        style={[
          styles.chatContainer,
          { backgroundColor: isDark ? "#121212" : "#FFFFFF" },
        ]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? height * 0.12 : 0}
      >
        <ThemeView style={styles.inputContainer}>
          <TextInput
            placeholder="질문을 입력하세요"
            placeholderTextColor={colors.subText}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? "#1E1E1E" : "#F9F9F9",
                borderColor: colors.border,
              },
            ]}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Button title="보내기" onPress={handleSend} />
        </ThemeView>
      </KeyboardAvoidingView>
    </ThemeView>
  );
};

export default ChatBotComponent;

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },

  chatContainer: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  bubbleContainer: {
    maxWidth: "75%",
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
