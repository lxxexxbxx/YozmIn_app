import React, { useEffect, useState } from "react";
import { Text, View, FlatList, ActivityIndicator } from "react-native";

const API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY; // GPT-4o API 키 입력

const NewsComponent = () => {
    const [newsTopics, setNewsTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNewsTopics = async () => {
            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        messages: [{ role: "user", content: "오늘의 주요 뉴스 분야와 관계없이 주제 TOP10을 알려줘." }],
                        max_tokens: 200
                    })
                });

                const data = await response.json();
                console.log("🔹 GPT-4o API 응답 전체:", data); // 전체 응답 출력

                const content = data.choices?.[0]?.message?.content || "";
                console.log("🔹 GPT-4o 응답 (텍스트):", content); // GPT-4o 응답 메시지

                const topics = content.split("\n").map(topic => topic.replace(/^\d+\.\s*/, ""));
                console.log("🔹 파싱된 뉴스 주제 목록:", topics); // 배열 형태로 변환된 뉴스 주제

                setNewsTopics(topics);
            } catch (error) {
                console.error("🚨 Error fetching news topics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNewsTopics();
    }, []);

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, top: 50 }}>
                오늘의 주요 뉴스 TOP 10
            </Text>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={newsTopics}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Text style={{ fontSize: 16, marginVertical: 5, top: 50 }}>• {item}</Text>
                    )}
                />
            )}
        </View>
    );
};

export default NewsComponent;