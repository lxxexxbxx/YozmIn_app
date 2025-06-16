import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import axios from "axios";
import PageTitleComponent from "../../common/PageTitleComponent";
import Icon from "react-native-vector-icons/FontAwesome";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export default function MovieDetailComponent({ route }) {
    const { id, type } = route.params;
    const navigation = useNavigation();

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
            params: {
                api_key: TMDB_API_KEY,
                language: "ko-KR",
            },
        });
        const trailers = res.data.results.filter(
            (v) => v.type === "Trailer" && v.site === "YouTube"
        );
        if (trailers.length > 0) {
            setVideoKey(trailers[0].key);
        }
    };

    const fetchRecommendations = async () => {
        const res = await axios.get(`${BASE_URL}/${type}/${id}/recommendations`, {
            params: {
                api_key: TMDB_API_KEY,
                language: "ko-KR",
            },
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

    if (!detail) return <Text style={{ color: "white" }}>Loading...</Text>;

    return (
        <View style={{ flex: 1, backgroundColor: "black" }}>
            <PageTitleComponent darkMode={true} />
            <ScrollView contentContainerStyle={styles.container}>
                {videoKey ? (
                    <View style={{ width: "100%", height: 230, marginBottom: 16 }}>
                        <WebView
                            source={{ uri: `https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&controls=1` }}
                            style={{ flex: 1, borderRadius: 12 }}
                            javaScriptEnabled
                            allowsFullscreenVideo
                        />
                    </View>
                ) : (
                    <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w500${detail.poster_path}` }}
                        style={styles.poster}
                    />
                )}

                <Text style={styles.title}>{detail.title || detail.name}</Text>
                <Text style={styles.overview}>{detail.overview}</Text>
                <Text style={styles.ratingText}>평점: {detail.vote_average}</Text>
                {renderStars(detail.vote_average)}

                {providers.length > 0 && (
                    <View style={styles.providerContainer}>
                        <Text style={styles.providerTitle}>시청 가능:</Text>
                        <View style={styles.providers}>
                            {providers.map((provider) => (
                                <Image
                                    key={provider.provider_id}
                                    source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                                    style={styles.providerLogo}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {recommendations.length > 0 && (
                    <View style={{ marginTop: 30, width: "100%" }}>
                        <Text style={styles.recommendTitle}>관련 콘텐츠</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {recommendations.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => navigation.push("MovieDetail", {
                                        id: item.id,
                                        type: type
                                    })}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
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
        color: "white",
    },
    overview: {
        fontSize: 16,
        marginTop: 10,
        textAlign: "center",
        color: "white",
    },
    ratingText: {
        fontSize: 18,
        marginTop: 10,
        fontWeight: "600",
        color: "white",
    },
    providerContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    providerTitle: {
        fontSize: 18,
        marginBottom: 10,
        color: "white",
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
        color: "white",
        marginBottom: 10,
    },
    recommendPoster: {
        width: 100,
        height: 150,
        borderRadius: 10,
    },
});
