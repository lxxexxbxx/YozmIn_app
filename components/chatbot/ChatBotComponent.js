import React, { useRef, useState } from 'react';
import {
    View,
    TextInput,
    Button,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Text,
} from 'react-native';
import { CommonUtils } from "../common/CommonUtils";
import TypingText from "./TypingText";

const { height } = Dimensions.get("window");

const ChatBotComponent = () => {
    const [input, setInput] = useState(""); // 사용자 입력값
    const [messages, setMessages] = useState([]); // 대화 메시지 배열
    const scrollRef = useRef(null);

    // 채팅 시각(시, 분)
    const getTime = () => {
        const now = new Date();
        return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    // 보내기
    const handleSend = async () => {
        if (!input.trim()) return; // input 값 없을 경우 return

        // 권한(유저/LLM), 텍스트(입력/답변 값), 채팅 시각(시,분)
        const userMessage = { role: "user", text: input.trim(), time: getTime() };
        // 기존 messages 배열에 userMessage 추가한 배열 생성 > setMessages
        setMessages(prev => [...prev, userMessage]);
        setInput(""); // inputbox 초기화

        const response = await CommonUtils.fetchGemini(input); // LLM API 호출
        // 권한(유저/LLM), 텍스트(입력/답변 값), 채팅 시각(시,분)
        const botMessage = { role: "llm", text: response, time: getTime() };
        // 기존 messages 배열에 botMessage 추가한 배열 생성 > setMessages
        setMessages(prev => [...prev, botMessage]);

        // 자동 스크롤
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    // 메시지 렌더링 함수
    const renderMessage = (msg, idx) => {
        const isLast = idx === messages.length - 1; // 마지막 메시지인지?
        const isLLM = msg.role === "llm"; // LLM의 답변인지?

        return (
            <View
                key={idx}
                style={[
                    styles.bubbleContainer,
                    isLLM ? styles.llmBubble : styles.userBubble
                ]}
            >
                {/*LLM 버블 + 마지막 버블일 때*/}
                {isLLM && isLast ? (
                    <TypingText fullText={msg.text} speed={30} />
                ) : (
                    <Text style={styles.messageText}>{msg.text}</Text>
                )}
                <Text style={styles.timeText}>{msg.time}</Text>
            </View>
        );
    };

    return (
        <View style={styles.inner}>
            <ScrollView
                ref={scrollRef}
                style={styles.chatContainer}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map(renderMessage)}
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? height * 0.12 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="질문을 입력하세요"
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <Button title="보내기" onPress={handleSend} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ChatBotComponent;

const styles = StyleSheet.create({
    inner: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 16,
        backgroundColor: '#fff',
    },
    chatContainer: {
        flex: 1,
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginRight: 8,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: "#f9f9f9",
    },
    bubbleContainer: {
        maxWidth: "75%",
        marginVertical: 4,
        padding: 10,
        borderRadius: 12,
    },
    userBubble: {
        backgroundColor: "#DCF8C6",
        alignSelf: "flex-end",
        borderBottomRightRadius: 0,
    },
    llmBubble: {
        backgroundColor: "#E2E2E2",
        alignSelf: "flex-start",
        borderBottomLeftRadius: 0,
    },
    messageText: {
        fontSize: 16,
        color: "#000",
    },
    timeText: {
        fontSize: 12,
        color: "#555",
        marginTop: 4,
        alignSelf: "flex-end",
    },
});
