import {StyleSheet, ActivityIndicator, FlatList, SafeAreaView, TouchableOpacity, View, Text, Animated} from "react-native";
import {useEffect, useState, useRef} from "react";
import {CommonUtils} from "../../common/CommonUtils";

const GeminiComponents = ({w, h}) => {
    const searchWord = "밈 + 챌린지";
    const dateRestrict = "m2"; // 검색 범위를 2개월로 설정

    const [loading, setLoading] = useState(false);
    const [memeKeywords, setMemeKeywords] = useState([]);

    const loadTrendingMemes = async () => {
        setLoading(true);
        try {
            const rawKeywords = await CommonUtils.googleSearch(searchWord, dateRestrict);
            const refinedKeywords = await CommonUtils.fetchGeminiTrendKeywords(rawKeywords);
            setMemeKeywords(refinedKeywords);
        } catch (error) {
            console.error("Error fetching memes:", error);
        }
        setLoading(false);
    }

    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadTrendingMemes();
        // 화살표 위아래로 움직이는 애니메이션
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: 10, duration: 500, useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: "#000", width: w, height: h}}>
            <View style={styles.container}>
                <Text style={styles.header}>🔥 요즘 핫한 밈 & 챌린지 🔥</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#ff6347"/>
                ) : (
                    <FlatList
                        data={memeKeywords}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({item}) => (
                            <View style={styles.item}>
                                <Text style={styles.text}>#{item}</Text>
                            </View>
                        )}
                        removeClippedSubviews={true}
                    />
                )}
                <Text style={styles.footer}>아래로 내려서 영상들을 확인해보세요!</Text>
                <Animated.Text style={[styles.arrow, { transform: [{ translateY: bounceAnim }] }]}>⇩ ⇩ ⇩</Animated.Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 50,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 20,
    },
    footer: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 20,
    },
    item: {
        backgroundColor: "#1e1e1e",
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
    },
    text: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        opacity: 1,
    },
    button: {
        marginTop: 20,
        backgroundColor: "#ff6347",
        padding: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    arrow: {
        fontSize: 30,
        color: "#ff6347",
        fontWeight: "bold",
        marginTop: 5,
    },
});

export default GeminiComponents;