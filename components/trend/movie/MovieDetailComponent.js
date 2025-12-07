import React, { useEffect, useState } from "react";
import {
  Dimensions, FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";
import PageTitleComponent from "../../common/PageTitleComponent";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useKeyStore } from "../../../stores/KeyStore";
import { ThemeView, ThemeText } from "../../common/ThemeComponents";
import { useTheme } from "../../settings/theme/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function MovieDetailComponent({ route }) {
  const keyStore = useKeyStore();
  const TMDB_API_KEY = keyStore.TMDB_API_KEY;
  const BASE_URL = "https://api.themoviedb.org/3";

  const { id, type } = route.params;
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [detail, setDetail] = useState(null);
  const [providers, setProviders] = useState([]);
  const [videoKey, setVideoKey] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchDetail();
    fetchProviders();
    fetchVideo();
    fetchRecommendations();
  }, []);

  const fetchDetail = async () => {
    const response = await axios.get(`${BASE_URL}/${type}/${id}`, {
      params: { api_key: TMDB_API_KEY, language: "ko-KR" },
    });
    setDetail(response.data);
  };

  const fetchProviders = async () => {
    const response = await axios.get(`${BASE_URL}/${type}/${id}/watch/providers`, {
      params: { api_key: TMDB_API_KEY },
    });
    if (response.data.results?.KR?.flatrate) {
      setProviders(response.data.results.KR.flatrate);
    }
  };

  const fetchVideo = async () => {
    const response = await axios.get(`${BASE_URL}/${type}/${id}/videos`, {
      params: { api_key: TMDB_API_KEY, language: "ko-KR" },
    });
    const trailers = response.data.results.filter(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );
    if (trailers.length > 0) setVideoKey(trailers[0].key);
  };

  const fetchRecommendations = async () => {
    const response = await axios.get(`${BASE_URL}/${type}/${id}/recommendations`, {
      params: { api_key: TMDB_API_KEY, language: "ko-KR" },
    });
    setRecommendations(response.data.results || []);
  };

  const renderStars = (voteAverage) => {
    const fullStars = Math.round(voteAverage / 2);
    return (
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {[...Array(5)].map((_, i) => (
          <Icon
            key={i}
            name={i < fullStars ? "star" : "star-o"}
            size={20}
            color="#FFD700"
            style={{ marginRight: 4 }}
          />
        ))}
      </View>
    );
  };

  if (!detail)
    return (
      <ThemeView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ThemeText>Loading...</ThemeText>
      </ThemeView>
    );

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageTitleComponent title={"상세정보"} darkMode={colors.background !== "#FFFFFF"} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemeText style={[styles.title, { color: colors.text }]}>
          {detail.title || detail.name}
        </ThemeText>
        {/* 영상 또는 포스터 */}
        {videoKey ? (
          <View style={{ width: "100%", height: 230, marginBottom: 16 }}>
            <YoutubePlayer
              height={230}
              play={true}
              videoId={videoKey}
              initialPlayerParams={{
                controls: true,
                modestbranding: true,
                rel: false,
                mute: 1,
              }}
              onError={(e) => {
                console.warn("YouTube error:", e);
                setVideoKey(null);
              }}
            />
          </View>
        ) : (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${detail.poster_path}` }}
            style={styles.poster}
          />
        )}

        <ThemeText style={{flex: 1, height: 1, backgroundColor: colors.text, marginBottom: 30}}>-</ThemeText>

        {/* 영화 정보 */}
        <ThemeText style={[styles.ratingText, { color: colors.text }]}>
          평점: {renderStars(detail.vote_average.toFixed(1))} {detail.vote_average.toFixed(1)}점
        </ThemeText>
        <ThemeText style={[styles.overview, { color: colors.text }]}>
          {detail.genres[0] ? detail.genres[0].name : ""}
          {detail.genres[1] ? "/" + detail.genres[1].name : ""}
          {detail.genres[2] ? "/" + detail.genres[2].name : ""}
          {detail.genres[3] ? "/" + detail.genres[3].name : ""}
          {type === "movie" ? " | " + (detail.runtime / 60).toFixed(1) + "시간" : ""}
        </ThemeText>
        <ThemeText style={[styles.overview, { color: colors.text }]}>
          {type === "tv" ? "방영시작일" : "개봉일"}: {type === "tv" ? detail.first_air_date : detail.release_date}
        </ThemeText>
        <ThemeText style={[styles.overview, { color: colors.text }]}>
          {detail.overview}
        </ThemeText>

        {/* ✅ 시청 가능 플랫폼 */}
        {providers.length > 0 && (
          <ThemeView style={styles.providerContainer}>
            <ThemeText style={[styles.providerTitle, { color: colors.text }]}>
              시청 가능:
            </ThemeText>
            <View style={styles.providers}>
              {providers.map((provider) => (
                <Image
                  key={provider.provider_id}
                  source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                  style={styles.providerLogo}
                />
              ))}
            </View>
          </ThemeView>
        )}

        <ThemeText style={{flex: 1, height: 1, backgroundColor: colors.text, marginTop: 30}}></ThemeText>

        {/* ✅ 추천 콘텐츠 */}
        {recommendations.length > 0 && (
            <ThemeView style={{ marginTop: 30, width: "100%" }}>
              <ThemeText style={[styles.recommendTitle, { color: colors.text }]}>
                관련 콘텐츠
              </ThemeText>

              {/* 2열 그리드: FlatList 대신 수동으로 묶기 */}
              <View style={styles.recommendGrid}>
                {recommendations.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.recommendItem,
                          // 오른쪽 아이템에는 약간 왼쪽 여백
                          index % 2 === 1 && { marginLeft: 8 },
                        ]}
                        onPress={() =>
                            navigation.push("TrendMovieDetail", { id: item.id, type: type })
                        }
                    >
                      <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                          style={styles.recommendPoster}
                      />
                      <ThemeText
                          style={[styles.overview, { color: colors.text }]}
                          numberOfLines={2}
                      >
                        {item.title}
                      </ThemeText>
                    </TouchableOpacity>
                ))}
              </View>
            </ThemeView>
        )}
      </ScrollView>
    </ThemeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  poster: {
    width: 250,
    height: 350,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "left",
  },
  overview: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "left",
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "600",
  },
  providerContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  providerTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  providers: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  providerLogo: {
    width: 50,
    height: 50,
    margin: 8,
  },
  recommendTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  recommendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",      // 줄 바꿈
    justifyContent: "space-between",
  },
  recommendItem: {
    width: "48%",          // 2열
    marginBottom: 16,
  },
  recommendPoster: {
    width: "100%",
    aspectRatio: 2 / 3,    // 포스터 비율
    borderRadius: 8,
    marginBottom: 6,
  },
});
