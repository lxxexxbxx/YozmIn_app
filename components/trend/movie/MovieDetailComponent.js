import React, { useEffect, useState } from "react";
import {
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
    const res = await axios.get(`${BASE_URL}/${type}/${id}/videos`, {
      params: { api_key: TMDB_API_KEY, language: "ko-KR" },
    });
    const trailers = res.data.results.filter(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );
    if (trailers.length > 0) setVideoKey(trailers[0].key);
  };

  const fetchRecommendations = async () => {
    const res = await axios.get(`${BASE_URL}/${type}/${id}/recommendations`, {
      params: { api_key: TMDB_API_KEY, language: "ko-KR" },
    });
    setRecommendations(res.data.results || []);
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
      <PageTitleComponent darkMode={colors.background !== "#FFFFFF"} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* ✅ 영상 또는 포스터 */}
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

        {/* ✅ 영화 정보 */}
        <ThemeText style={[styles.title, { color: colors.text }]}>
          {detail.title || detail.name}
        </ThemeText>
        <ThemeText style={[styles.overview, { color: colors.text }]}>
          {detail.overview}
        </ThemeText>
        <ThemeText style={[styles.ratingText, { color: colors.text }]}>
          평점: {detail.vote_average}
        </ThemeText>
        {renderStars(detail.vote_average)}

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

        {/* ✅ 추천 콘텐츠 */}
        {recommendations.length > 0 && (
          <View style={{ marginTop: 30, width: "100%" }}>
            <ThemeText style={[styles.recommendTitle, { color: colors.text }]}>
              관련 콘텐츠
            </ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendations.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    navigation.push("MovieDetail", { id: item.id, type: type })
                  }
                  style={{ marginRight: 12 }}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w154${item.poster_path}` }}
                    style={styles.recommendPoster}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
    alignItems: "center",
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
  },
  overview: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  ratingText: {
    fontSize: 18,
    marginTop: 10,
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
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  recommendPoster: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
});
