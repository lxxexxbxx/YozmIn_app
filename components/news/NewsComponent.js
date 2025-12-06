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
    <ThemeView style={[styles.container, { backgroundColor: colors.subBackground }]}>

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
      </View>

      <View style={{ height: 20 }} />

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
                    ? "rgba(118, 166, 255, 1)"
                    : isDark
                      ? "#2A2A2A"
                      : "rgba(118, 166, 255, 1)",
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

      <View style={{ height: 20 }} />

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
                  // ✅ 원래대로 복구: 다크모드일 때 회색(#2A2A2A) 유지
                  { backgroundColor: isDark ? "#2A2A2A" : "#F8F9FA" },
                ]}
                onPress={() =>
                  navigation.navigate("NewsDetail", { keyword: item })
                }
              >
                {/* 1. 왼쪽: 순위 영역 */}
                {/* 🚨 중요: ThemeView -> View로 변경 (검은 배경 제거됨) */}
                <View style={styles.rankColumn}>
                  <ThemeText style={[styles.topText, { color: colors.text }]}>
                    TOP.
                  </ThemeText>
                  <ThemeText style={[styles.rankNumber, { color: colors.text, marginRight: 5 }]}>
                    {index + 1}
                  </ThemeText>
                  <ThemeText style={styles.medalEmoji}>
                    {getMedalEmoji(index + 1)}
                  </ThemeText>
                </View>

                {/* 2. 오른쪽: 뉴스 제목 영역 */}
                {/* 🚨 중요: ThemeView -> View로 변경 (검은 배경 제거됨) */}
                <View style={styles.titleColumn}>
                  <ThemeText
                    style={[styles.newsText, { color: colors.text }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item}
                  </ThemeText>
                </View>
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
  },
  header: {
    paddingVertical: 10,
    marginTop: 10,
    alignItems: "center",
    marginBottom: 10,
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
    marginTop: 5,
  },
  tabContainer: {
    maxHeight: 35,
    marginHorizontal: 10,
  },
  tabContentContainer: {
    paddingHorizontal: 10,
    gap: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8.5,
    borderRadius: 20,
    marginRight: 10,
    height: 35,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  newsContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 5,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rankColumn: {
    width: width * 0.22,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 5,
    flexDirection: 'row',
    // backgroundColor: 'transparent', // View는 기본이 투명이므로 없어도 됨
  },
  topText: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    marginRight: 2,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  medalEmoji: {
    fontSize: 20,
  },
  titleColumn: {
    flex: 1,
    paddingLeft: 15,
    justifyContent: 'center',
    minHeight: 50,
    // backgroundColor: 'transparent', // View는 기본이 투명이므로 없어도 됨
  },
  newsText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
});

export default NewsComponent;