import React, { useEffect, useState } from "react";
import {View, FlatList, Image, Text, TouchableOpacity, StyleSheet, SafeAreaView} from "react-native";
import axios from "axios";
import {useNavigation} from "@react-navigation/native";

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export default function MovieListComponent({ category }) {
    const navigation = useNavigation();
    const [contents, setContents] = useState([]);

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
        const oneMonthAgo = `${year}-${month}-${day}`;  // "YYYY-MM-DD" 형식
        console.log(today, year, month, day, oneMonthAgo);

        const response = await axios.get(url, {
            params : {
                "api_key": TMDB_API_KEY,
                "language": "ko-KR",
                "sort_by": "popularity.desc",
                "with_origin_country": "KR",
                "first_air_date.gte": oneMonthAgo,  // 한 달 이내에 첫 방영된 시리즈
                "include_adult": false,
                "page": 1
            },
        });
        setContents(response.data.results);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("TrendMovieDetail", { id: item.id, type: category.includes("tv") ? "tv" : "movie" })}
        >
            <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                style={styles.poster}
            />
            <Text style={styles.title}>{item.title || item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: "black"}}>
            <FlatList
                data={contents}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={{ padding: 10 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
        color: "white",
    },
});
