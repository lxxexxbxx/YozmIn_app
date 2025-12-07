import React, { useEffect, useState } from "react";
import { FlatList, Image, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useKeyStore } from "../../../stores/KeyStore";
import { ThemeView, ThemeText } from "../../common/ThemeComponents";
import { useTheme } from "../../settings/theme/ThemeContext";

export default function MovieListComponent({ category }) {
  const keyStore = useKeyStore();
  const TMDB_API_KEY = keyStore.TMDB_API_KEY;
  const BASE_URL = "https://api.themoviedb.org/3";

  const navigation = useNavigation();
  const [contents, setContents] = useState([]);
  const { colors } = useTheme(); // ✅ 테마 색상 가져오기

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    let url;
    if (category === "movie_popular") url = `${BASE_URL}/discover/movie`;
    else if (category === "tv_popular") url = `${BASE_URL}/discover/tv`;

    const today = new Date();
    const oneMonthAgoDate = new Date(today.setMonth(today.getMonth() - 1));

    const year = oneMonthAgoDate.getFullYear();
    const month = String(oneMonthAgoDate.getMonth() + 1).padStart(2, "0");
    const day = String(oneMonthAgoDate.getDate()).padStart(2, "0");
    const oneMonthAgo = `${year}-${month}-${day}`; // "YYYY-MM-DD" 형식

    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        language: "ko-KR",
        sort_by: "popularity.desc",
        with_origin_country: "KR",
        "certification.gte": "ALL",
        "certification.lte": "19",
        certification_country: "KR",
        "first_air_date.gte": oneMonthAgo,
        include_adult: false,
        page: 1,
      },
    });

    // 금칙어 필터링
    const bannedKeywords = ["19", "야한", "에로", "노출", "새엄마", "가슴", "무삭제", "무삭제판", "동창회", "섹스"];

    const filteredResults = response.data.results.filter((movie) => {
      const title = (movie.title || movie.name || "").toLowerCase();
      const hasBannedWord = bannedKeywords.some((keyword) => title.includes(keyword.toLowerCase()));
      return !hasBannedWord;
    });

    // filteredResults.filter((detail) => {
    //   if(detail.adult === true) return false;
    // })

    setContents(filteredResults);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("TrendMovieDetail", {
          id: item.id,
          type: category.includes("tv") ? "tv" : "movie",
        })
      }
    >
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
        style={styles.poster}
      />
      <ThemeText style={[styles.title, { color: colors.text }]}>
        {item.title || item.name}
      </ThemeText>
    </TouchableOpacity>
  );

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={contents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ padding: 10 }}
      />
    </ThemeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    margin: 5,
    alignItems: "center",
  },
  poster: {
    width: 150,
    height: 220,
    borderRadius: 12,
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
