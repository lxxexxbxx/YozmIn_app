import React, { useEffect, useRef, useState } from "react";
import {
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Dimensions,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import TypingText from "./TypingText";
import { useUserStore } from "../../stores/UserStore";
import { useKeyStore } from "../../stores/KeyStore";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

// ==========================================
// [설정] 여기에 백엔드 API URL을 입력하세요.
// 예: "https://your-server.com/api/chat"
// ==========================================
const API_URL = "https://qwby9heo12ouhnej.us-east-1.aws.endpoints.huggingface.cloud";

const { height } = Dimensions.get("window");

// 특정 질문에 대해서는 고정 답변을 리턴하는 함수
const getFixedReply = (userText) => {
  const text = userText.trim();

  // 1) 2025년 10월 밈 질문
  if (text.includes("2025년 10월") && text.includes("유행") && text.includes("밈")) {
    return "2025년 10월쯤에는 소다팝, 영포티, 개웃겨서 도티 낳음 이런 밈들 많이 돌았을걸? 친구들이랑 톡할 때 한 번씩 써먹으면 괜히 더 웃김 ㅋㅋ";
  }

  // 2) “요즘 사람들은 밈 어디서 많이 보지?” 같은 흐름
  if (text.includes("요즘") && text.includes("사람들") && text.includes("밈") && text.includes("어디서")) {
    return "요즘 밈은 거의 틱톡이랑 인스타 릴스가 성지야 ㅋㅋ 유튜브 쇼츠도 금방 퍼지고. 그냥 아무 생각 없이 스크롤 내리다 보면 갑자기 새로운 밈 하나씩 장착돼 있음.";
  }

  // 3) “그럼 너는 밈 같은 거 볼 시간은 있어?” 같은 흐름
  if (text.includes("너는") && text.includes("밈") && text.includes("시간")) {
    return "나는 직접 영상 보고 웃는 건 못 하지만, 사람들이 많이 쓰는 표현들이나 자주 나오는 밈은 계속 학습하고 있어! 그래서 밈 얘기 나와도 웬만하면 바로 받아칠 수 있음 ㅎㅎ 😎";
  }

  // 고정 매칭이 없으면 null
  return null;
};

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

  /**
   * [NEW] 커스텀 API (GEMMA 3) 호출 함수
   * 서버의 요청/응답 스키마(JSON 구조)에 맞춰 수정이 필요할 수 있습니다.
   */
  const fetchCustomLLM = async (text, currentMessages = []) => {
    try {
      // 1. 본인의 허깅페이스 토큰을 여기에 입력하세요 (Classic Read 토큰 추천)
      const HF_TOKEN = "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";

      if (!API_URL) {
        console.warn("API URL이 설정되지 않았습니다.");
        return "개발자님, API URL을 코드에 설정해주세요! 😅";
      }

      const payload = {
        inputs: text, // handler.py와 통신할 때는 'inputs'라는 키가 표준입니다.
        history: currentMessages.map((msg) => ({
          role: msg.role === 'llm' ? 'assistant' : 'user',
          content: msg.text
        })),
      };

      console.log("서버로 보내는 데이터:", JSON.stringify(payload, null, 2));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🚨 [★핵심 수정] Bearer 토큰 인증 추가 (공백 주의!)
          "Authorization": `Bearer ${HF_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      // 401 에러 발생 시 로그 확인용
      if (response.status === 401) {
        console.error("401 Unauthorized: 토큰이 잘못되었거나 권한이 없습니다.");
        return "인증 에러가 발생했어. 토큰을 확인해줘! 🔑";
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`서버 에러 (${response.status}):`, errorText);
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();

      // handler.py에서 return {"response": answer} 로 줬으므로 data.response를 읽습니다.
      return data.response || "응답을 처리하지 못했어.. 😭";

    } catch (error) {
      console.error("LLM Fetch Error:", error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    scrollRef.current?.scrollToEnd({ animated: true });

    const userText = input.trim();
    // 화면에 표시할 때는 'llm', 'user' 사용
    const userMessage = { role: "user", text: userText, time: getTime() };

    // 1. UI 즉시 업데이트
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // 2. 고정 답변 확인 (생략...)
    const fixedReply = getFixedReply(userText);
    if (fixedReply) {
      // (기존 코드 유지...)
      return;
    }

    // 3. 서버 통신
    try {
      // 🚨 [수정] messages 상태를 함께 넘겨줍니다 (대화 문맥 유지용)
      const response = await fetchCustomLLM(userText, messages);

      setTimeout(() => {
        const botMessage = { role: "llm", text: response, time: getTime() };
        setMessages((prev) => [...prev, botMessage]);
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 500);

    } catch (e) {
      const botMessage = {
        role: "llm",
        text: "서버와 연결이 원활하지 않아. 잠시 후 다시 시도해줘! 😭",
        time: getTime(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }
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
    if (userStore.name) {
      const prompt = `
      사용자명: ${userStore.name}
      어떤 질문을 하실 지 오프닝 하는 멘트를 먼저 해줘. 말은 반말로 해주되 정중하게 해줘 ex. 이재혁씨 반가워 오늘은 무엇을 알려줄까? 예시 처럼 이름 뒤에 씨 붙이고 정중하게 말해줘.
      `;
      try {
        // [CHANGE] 초기 메시지도 커스텀 API 사용
        const response = await fetchCustomLLM(prompt);
        const botMessage = { role: "llm", text: response, time: getTime() };
        setMessages((prev) => [...prev, botMessage]);
      } catch (e) {
        // 초기화 실패 시 조용히 넘어가거나 기본 메시지 출력
        console.log("Init msg fetch failed");
      }
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
          backgroundColor: isDark ? "#121212" : "#FFFFFF",
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        style={[
          styles.chatContainer,
          { backgroundColor: isDark ? "#121212" : "#FFFFFF" },
        ]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <KeyboardAvoidingView
        style={styles.Container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ThemeView
          style={[
            styles.commentInputContainer,
            {
              backgroundColor: colors.boxBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            placeholder="질문을 입력하세요"
            placeholderTextColor={colors.subText}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? "#1E1E1E" : "#F0F0F0",
              },
            ]}
            value={input}
            onChangeText={setInput}
            multiline
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!input}
            style={styles.sendButton}
          >
            <Ionicons
              name="send"
              size={28}
              color={!input ? "#666" : "#4A90E2"}
            />
          </TouchableOpacity>
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
    marginHorizontal: 10,
    borderRadius: 16,
    marginBottom: 10, // 키보드 뷰와 간격 확보
  },
  // inputContainer 스타일이 없어서 아래 commentInputContainer와 중복되거나 미사용일 수 있어 유지
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100, // 입력창 너무 커지지 않게 제한
  },
  bubbleContainer: {
    maxWidth: "75%",
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
  },
  // sendButton 스타일이 누락되어 있어 추가 (아이콘 정렬용)
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  // Container 스타일이 누락되어 있어 추가 (KeyboardAvoidingView용)
  Container: {
    width: '100%',
  }
});