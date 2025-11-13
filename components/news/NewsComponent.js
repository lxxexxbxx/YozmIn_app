import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchNewsTitles } from "./NewsAPI/NaverNewsAPIComponents";
import { fetchNewsTrends } from "./NewsAPI/GeminiAPIComponent";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { key: "all", label: "전체", query: "뉴스" },
  { key: "politics", label: "정치", query: "정치" },
  { key: "economy", label: "경제", query: "경제" },
  { key: "society", label: "사회", query: "사회" },
  { key: "it_science", label: "IT/과학", query: "IT" },
  { key: "world", label: "국제", query: "국제" },
  { key: "sports", label: "스포츠", query: "스포츠" },
  { key: "entertainment", label: "연예", query: "연예" },
];

const NewsComponent = ({ navigation }) => {
  const [newsTopics, setNewsTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { colors, isDark } = useTheme();

  const fetchAndAnalyzeNews = async (categoryKey = "all") => {
    try {
      setLoading(true);
      const categoryObject = CATEGORIES.find((cat) => cat.key === categoryKey);
      const query = categoryObject ? categoryObject.query : CATEGORIES[0].query;
      const newsTitles = await fetchNewsTitles(query);
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
      await AsyncStorage.removeItem("news_titles");
      await fetchAndAnalyzeNews(selectedCategory);
    } catch (error) {
      console.error("🚨 뉴스 데이터 삭제 오류:", error);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchAndAnalyzeNews(category);
  };

  useEffect(() => {
    fetchAndAnalyzeNews(selectedCategory);
  }, []);

  return (
    // ✅ 화면 전체 배경 (회색 or 어두운 회색)
    <ThemeView style={[styles.container, { backgroundColor: colors.subBackground }]}>
      {/* ✅ 상단 헤더 (기본 View로 자연스럽게) */}
      <View style={styles.header}>
        <ThemeText style={[styles.headerTitle, { color: colors.subText }]}>
          요즘 사람이 알아야 할
        </ThemeText>
        <ThemeText style={[styles.mainTitle, { color: colors.text }]}>
          금일 뉴스{" "}
          <ThemeText
            style={{
              fontWeight: "bold",
              textDecorationLine: "underline",
              color: colors.text,
            }}
          >
            TOP 5
          </ThemeText>{" "}
          📰
        </ThemeText>

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.accent }]}
          onPress={refreshNewsData}
        >
          <ThemeText style={styles.refreshText}>🔄 뉴스 새로고침</ThemeText>
        </TouchableOpacity>
      </View>

      {/* ✅ 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  selectedCategory === category.key
                    ? colors.accent
                    : isDark
                    ? "#333"
                    : "#E5E5EA",
              },
            ]}
            onPress={() => handleCategoryChange(category.key)}
          >
            <ThemeText
              style={[
                styles.tabText,
                {
                  color:
                    selectedCategory === category.key
                      ? "#fff"
                      : colors.text,
                },
              ]}
            >
              {category.label}
            </ThemeText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ✅ 뉴스 목록 (박스 부분만 색상 변경) */}
      <View style={[styles.newsContainer, { backgroundColor: colors.boxBackground }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : (
          <FlatList
            data={newsTopics}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.newsItemContainer,
                  { backgroundColor: isDark ? "#2A2A2A" : "#F8F9FA" },
                ]}
                onPress={() =>
                  navigation.navigate("NewsDetail", { keyword: item })
                }
              >
                <ThemeText style={[styles.rankText, { color: colors.text }]}>
                  TOP {index + 1} {getMedalEmoji(index + 1)}
                </ThemeText>
                <ThemeText
                  style={[styles.newsText, { color: colors.subText }]}
                >
                  {item}
                </ThemeText>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </ThemeView>
  );
};

// 🏅 순위별 아이콘
const getMedalEmoji = (rank) => {
  switch (rank) {
    case 1:
      return "🏆";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "⭐";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  refreshButton: {
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
  tabContainer: {
    maxHeight: 35,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  tabContentContainer: {
    paddingHorizontal: 10,
    gap: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  newsContainer: {
    flex: 1,
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
    marginBottom: 5,
  },
  newsText: {
    fontSize: 14,
  },
});

export default NewsComponent;
