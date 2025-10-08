import React, {useEffect, useRef, useState} from 'react';
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
import {useUserStore} from "../../stores/UserStore";
import {useKeyStore} from "../../stores/KeyStore";

const { height } = Dimensions.get("window");

const ChatBotComponent = () => {
    const [input, setInput] = useState(""); // 사용자 입력값
    const [messages, setMessages] = useState([]); // 대화 메시지 배열
    const scrollRef = useRef(null);

    const userStore = useUserStore();
    const keyStore = useKeyStore();

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

        // const response = await CommonUtils.fetchGemini(input); // LLM API 호출
        const response = await CommonUtils.fetchChatGPT(input); // LLM API 호출
        // 권한(유저/LLM), 텍스트(입력/답변 값), 채팅 시각(시,분)
        const botMessage = { role: "llm", text: response, time: getTime() };
        // 기존 messages 배열에 botMessage 추가한 배열 생성 > setMessages
        setMessages(prev => [...prev, botMessage]);

        // 자동 스크롤
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    // const user = {
    //     name: "홍길동",
    //     category: "영화/드라마",
    // };
    //
    // // 최초 진입 시 챗봇 멘트
    // const onFirst = async () => {
    //     await setInput(`안녕? 내 이름은 ${user.name}이야. ${user.category}에 대한 오늘의 추천 정보 좀 알려줄래?`);
    //     await handleSend;
    //     // setInput("");
    // }
    //
    // useEffect(() => {
    //     onFirst();
    // }, []);

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
    // 접속 시 인사 및 요약 정보 제공
    const init = async () => {
        if(userStore.name && keyStore.GOOGLE_API_KEY) {
            const prompt = `
            사용자명: ${userStore.name}\n 다음 사용자명을 가진 사용자에게 반갑게 인사하며 오늘의 날씨와 주요 뉴스를 아래 규칙에 맞게 답변해줘.
            
            !!규칙!!
            1. 주요 뉴스는 넘버링 붙여서 3개만 주요 정보 요약해서 제공(간략하게 요약하되 주요 키워드 등 주요 정보는 포함되어야 함.)
            2. 답변 내용에는 인터넷 주소 링크나 불필요한 특수문자, 기호 등은 제거하여 제공
            
            이 규칙대로 사용자에게 친근하고 친절하게 간략한 오늘의 정보 제공 해줘.
            `;
            // const response = await CommonUtils.fetchGemini(prompt);
            const response = await CommonUtils.fetchChatGPT(prompt);
            const botMessage = { role: "llm", text: response, time: getTime() };
            setMessages(prev => [...prev, botMessage]);
        }
    }

    useEffect(() => {
        init();
    }, []);

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
                    <Button id={"sendBtn"} title="보내기" onPress={handleSend} />
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
