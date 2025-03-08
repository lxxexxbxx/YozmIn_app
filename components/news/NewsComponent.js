import React, { useEffect, useState } from "react";
import { Text, View, FlatList, ActivityIndicator, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchNewsTitles } from "./NewsAPI/NaverNewsAPIComponents";
import { fetchNewsTrends } from "./NewsAPI/GeminiAPIComponent";

const { width } = Dimensions.get("window");

const NewsComponent = () => {
    const [newsTopics, setNewsTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAndAnalyzeNews = async () => {
        try {
            setLoading(true);
            console.log("🔹 네이버 뉴스 API에서 최신 뉴스 1000개 가져오는 중...");
            const newsTitles = await fetchNewsTitles();
            console.log("✅ 뉴스 1000개 가져오기 완료!");

            const topics = await fetchNewsTrends(newsTitles);
            setNewsTopics(topics);
        } catch (error) {
            console.error("🚨 뉴스 트렌드 분석 중 오류 발생:", error);
        } finally {
            setLoading(false);
        }
    };

    const refreshNewsData = async () => {
        try {
            console.log("🗑 기존 뉴스 데이터 삭제 중...");
            await AsyncStorage.removeItem("news_titles");
            console.log("✅ 뉴스 데이터 삭제 완료!");
            await fetchAndAnalyzeNews();
        } catch (error) {
            console.error("🚨 뉴스 데이터 삭제 오류:", error);
        }
    };

    useEffect(() => {
        fetchAndAnalyzeNews();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* ✅ 상단 제목 (컨테이너 없이 배경색 유지) */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>요즘 사람이 알아야 할</Text>
                <Text style={styles.mainTitle}>
                    금일 뉴스 <Text style={{ fontWeight: "bold", textDecorationLine: "underline" }}>TOP 10</Text>📰
                </Text>
                <TouchableOpacity style={styles.refreshButton} onPress={refreshNewsData}>
                    <Text style={styles.refreshText}>🔄 뉴스 새로고침</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ 뉴스 목록 컨테이너 */}
            <View style={styles.newsContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                    <FlatList
                        data={newsTopics}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <View style={styles.newsItemContainer}>
                                <Text style={styles.rankText}>TOP {index + 1} {getMedalEmoji(index + 1)}</Text>
                                <Text style={styles.newsText}>{item}</Text>
                            </View>
                        )}
                        contentContainerStyle={styles.listContainer}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

// 🏅 순위별 아이콘 추가 함수
const getMedalEmoji = (rank) => {
    switch (rank) {
        case 1: return "🏆";
        case 2: return "🥈";
        case 3: return "🥉";
        default: return "⭐";
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7", // ✅ 배경색 유지 (하얀 컨테이너와 분리)
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#555",
        textAlign: "center",
    },
    mainTitle: {
        fontSize: 30,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },
    refreshButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 10,
    },
    refreshText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    newsContainer: {
        flex: 1,
        backgroundColor: "#fff", // ✅ 뉴스 리스트 컨테이너만 하얀색
        marginHorizontal: 20,
        marginTop: 15,
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    listContainer: {
        paddingBottom: 50,
    },
    newsItemContainer: {
        backgroundColor: "#F8F9FA",
        padding: 15,
        marginVertical: 8,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    rankText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    newsText: {
        fontSize: 14,
        color: "#555",
    },
});

export default NewsComponent;
