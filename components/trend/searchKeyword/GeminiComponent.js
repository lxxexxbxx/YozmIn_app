import axios from "axios";
import {StyleSheet, ActivityIndicator, FlatList, SafeAreaView, TouchableOpacity, View, Text, Animated} from "react-native";
import {useEffect, useState, useRef} from "react";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const SEARCH_ENGINE_ID = process.env.EXPO_PUBLIC_SEARCH_ENGINE_ID;

const GeminiComponents = ({w, h}) => {
    const searchWord = "밈 + 챌린지";
    const dateRestrict = "m2"; // 검색 범위를 2개월로 설정

    const googleSearch = async () => {
        try {
            const url = `https://www.googleapis.com/customsearch/v1?q=${searchWord}&cx=${SEARCH_ENGINE_ID}&dateRestrict=${dateRestrict}&key=${GOOGLE_API_KEY}`;

            console.log("Google Search API 요청 URL:", url); // API 요청 URL을 출력하여 디버깅

            const response = await axios.get(url);
            const searchResults = response.data.items || [];

            // 검색 결과에서 제목 & 스니펫(설명) 기반으로 키워드 추출
            const keywords = searchResults.map(item => item.title + " " + item.snippet);

            return keywords;
        } catch (error) {
            console.error("Google Search API Error:", error);
            return [];
        }
    };


    const fetchGemini = async (keywords) => {
        try {
            const prompt = `
        최근 유행하는 밈과 챌린지에 대한 검색 결과를 분석하고, 밈이나 챌린지 키워드들을 정리해서 오늘 기준 한국에서 가장 핫한 키워드 5개만 나열해줘. 
        밈 챌린지 등 실제 밈이나 챌린지 내용이 아닌 단순 "밈 챌린지"와 같은 단어의 조합 같은 경우는 제외.

        ✅ 제공된 검색 데이터:
        ${keywords.join("\n")}

        🔥 분석 기준:
        - 검색 데이터에서 반복적으로 등장하는 키워드  
        - 현재 트렌드에 맞는 유행어 또는 밈  
        - 사람들이 SNS에서 많이 언급할 가능성이 높은 키워드  
        - 짧고 강렬한 단어 또는 표현

        🎯 결과 형식 (예시):
        1. 고독한 미식가
        2. 퀸 네버 크라이
        3. 헤어지자고? 너 누군데?
        4. 알잘딱깔센
        5. 칠가이

        📌 주의:
        - **기존 검색어를 그대로 나열하지 말고, 가장 핵심적인 5개만 정리**  
        - **순위는 인기와 트렌드에 따라 정렬**  
        - **유튜브, 틱톡, X(트위터) 등 SNS 사이트의 결과를 우선 반영**
        - **분석 결과, 현재 가장 트렌디한 ~ 과 같은 안내 멘트 일절 없이 5개의 키워드 만 반환**
        - **밈, 챌린지, 밈 챌린지, 유행 혹은 이들을 조합한 단어와 같은 직접적인 밈 내용이 아닌 것들로만 구성된 단어는 제외**
        - **리스트 형태로 반환**
        `;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
                {
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 300
                    }
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(response);

            // Gemini 응답에서 정리된 키워드 추출
            const refinedKeywords = response.data.candidates[0].content.parts[0].text
                .split("\n")
                .map(item => item.replace(/^[-*0-9.]\s*/, "").trim()) // 리스트 포맷 제거
                .filter(item => item.length > 0)
                .slice(0, 5);

            return refinedKeywords;
        } catch (error) {
            console.error("Gemini API Error:", error);
            return [];
        }
    };

    const [loading, setLoading] = useState(false);
    const [memeKeywords, setMemeKeywords] = useState([]);

    const loadTrendingMemes = async () => {
        setLoading(true);
        try {
            const rawKeywords = await googleSearch();
            const refinedKeywords = await fetchGemini(rawKeywords);
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
                {/*<TouchableOpacity style={styles.button} onPress={loadTrendingMemes}>*/}
                {/*    <Text style={styles.buttonText}>새로고침</Text>*/}
                {/*</TouchableOpacity>*/}
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