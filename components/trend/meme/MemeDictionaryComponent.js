import React, {useEffect, useRef, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Animated,
    Keyboard, PanResponder, TextInput, Platform, StatusBar
} from "react-native";
import { CommonUtils } from "../../common/CommonUtils";
import supabase from "../../../supabase";
import { Image as ExpoImage } from "expo-image";
import { SvgXml } from "react-native-svg";
import {useNavigation} from "@react-navigation/native";
import MemeDetailsComponent from "./MemeDetailsComponent";
import {Portal} from "react-native-paper";

const { width, height } = Dimensions.get("window");
const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight : 0; // 휴대폰 상단 상태바 크기
const SNAP_POINTS = {
    FULL: 0 + statusBarHeight,             // 완전 확장
    MID: height * 0.25,   // 기본 위치
    CLOSED: height       // 완전 닫힘
};

// 대한민국 연도별 카테고리
const years = ["2025년", "2024년", "2023년", "2022년", "2021년", "2020년", "2019년", "2018년", "2017년", "2016년", "2015년", "2014년", "2013년", "2012년", "2011년", "2010년"];
const months = ["2025년", "2024년", "2023년", "2022년", "2021년", "2020년", "2019년", "2018년", "2017년", "2016년", "2015년", "2014년", "2013년", "2012년", "2011년", "2010년"];

const RemoteSvg = ({ uri, height = 220 }) => {
    const [xml, setXml] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const r = await fetch(uri, { method: "GET" });
                const ct = r.headers.get("content-type") || "";
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                // content-type이 octet-stream이어도 text로 읽어서 처리
                const txt = await r.text();
                if (alive) setXml(txt);
            } catch (e) {
                if (alive) setErr(e);
            }
        })();
        return () => { alive = false; };
    }, [uri]);

    if (err) return <View style={{ height }} />; // 조용히 폴백
    if (!xml) return <ActivityIndicator style={{ height, justifyContent: "center" }} />;
    return <SvgXml xml={xml} width="100%" height={height} />;
};

// svg/webp 처리용 헬퍼
export const MemeImage = ({ uri, style }) => {
    if (!uri) return null;
    const isSvg = uri.toLowerCase().includes(".svg");
    const h = style?.height ?? 220;

    return isSvg ? (
        <RemoteSvg uri={uri} height={h} />
    ) : (
        <ExpoImage source={{ uri }} style={style} contentFit="cover" transition={150} />
    );
};

const MemeDictionaryComponent = () => {
    const [selectedYear, setSelectedYear] = useState("2025년");
    const [memes, setMemes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedItem, setSelectedItem] = useState(null);
    const bottomSheetRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(height)).current;

    const navigation = useNavigation();

    useEffect(() => {
        CommonUtils.noGoBack();
        fetchMemes();
    }, []);

    const fetchMemes = async () => {
        try {
            setLoading(true);
            // Supabase에서 trend_memes 테이블 전체 조회
            const { data, error } = await supabase
                .from("trend_memes")
                .select("id, year, month, title, desc, image")
                .order("year", { ascending: false })
                .order("month", { ascending: false })
                .order("id", { ascending: false });

            if (error) throw error;

            // desc나 image가 null인 경우 안전 처리
            const sanitized = data.map((item) => ({
                id: item.id.toString(),
                year: `${item.year}년`,
                month: `${item.month}월`,
                title: item.title || "(제목 없음)",
                desc: item.desc,
                summary: (String(item.desc).length > 60 ? String(item.desc).slice(0, 60) + "..." : item.desc) || "설명이 없습니다.",
                image:
                    item.image && item.image.startsWith("http")
                        ? item.image
                        : "https://via.placeholder.com/400x250.png?text=이미지+없음",
            }));

            setMemes(sanitized);
        } catch (err) {
            console.error("❌ Supabase fetch error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredMemes = memes.filter((m) => m.year === selectedYear);

    const openDetail = (item) => {
        setSelectedItem(item);
        setVisible(true);
        Animated.timing(translateY, {
            toValue: SNAP_POINTS.MID,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeDetail = () => {
        Keyboard.dismiss();
        Animated.timing(translateY, {
            toValue: SNAP_POINTS.CLOSED,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                const newY = SNAP_POINTS.MID + gesture.dy;

                // 0보다 작아도 (즉, 위로 쓸어올릴 때) 0까지는 허용
                if (newY < 0) {
                    translateY.setValue(0);
                } else if (newY > SNAP_POINTS.CLOSED) {
                    translateY.setValue(SNAP_POINTS.CLOSED);
                } else {
                    translateY.setValue(newY);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                const { dy, vy } = gesture;

                if (dy > 120 || vy > 0.5) {
                    // 아래로 충분히 내리면 닫기
                    closeDetail();
                } else if (dy < -120 || vy < -0.5) {
                    // 위로 충분히 올리면 완전 확장
                    Animated.spring(translateY, {
                        toValue: SNAP_POINTS.FULL,
                        useNativeDriver: true,
                    }).start();
                } else {
                    // 중간 위치로 돌아감
                    Animated.spring(translateY, {
                        toValue: SNAP_POINTS.MID,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const renderCard = ({ item }) => (
        <View style={styles.card}>
            <MemeImage uri={item.image} style={styles.image} />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.title}</Text>
                </View>
                <Text style={styles.summary}>{item.summary}</Text>
                <TouchableOpacity style={styles.button} onPress={() => openDetail(item)}>
                    <Text style={styles.buttonText}>자세히 보기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 상단 연도 탭바 */}
            <View style={{ height: 60 }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.yearTabs}
                >
                    {years.map((year) => (
                        <TouchableOpacity
                            key={year}
                            style={[
                                styles.yearTab,
                                selectedYear === year && styles.yearTabActive,
                            ]}
                            onPress={() => setSelectedYear(year)}
                        >
                            <Text
                                style={[
                                    styles.yearTabText,
                                    selectedYear === year && styles.yearTabTextActive,
                                ]}
                            >
                                {year}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* 로딩 표시 */}
            {loading ? (
                <ActivityIndicator
                    size="large"
                    color="#000"
                    style={{ marginTop: 40 }}
                />
            ) : (
                <FlatList
                    data={filteredMemes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCard}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>아직 등록된 밈이 없어요 😅</Text>
                    }
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                />
            )}

            {visible && (
                <Portal>
                    <View style={StyleSheet.absoluteFill}>
                        <TouchableOpacity
                            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
                            onPress={closeDetail}
                            activeOpacity={1}
                        />
                        <Animated.View
                            style={[
                                styles.cardContainer,
                                { transform: [{ translateY }] },
                            ]}
                        >
                            <View style={styles.dragHandle} {...panResponder.panHandlers}>
                                <View style={styles.dragBar} />
                            </View>

                            {selectedItem && <MemeDetailsComponent meme={selectedItem}/>}
                        </Animated.View>
                    </View>
                </Portal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },

    // 연도 탭바
    yearTabs: { alignItems: "center", paddingHorizontal: 12 },
    yearTab: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#eee",
        marginRight: 8,
    },
    yearTabActive: { backgroundColor: "#111" },
    yearTabText: { color: "#555", fontWeight: "600" },
    yearTabTextActive: { color: "#fff" },

    // 카드
    card: {
        backgroundColor: "#fafafa",
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        overflow: "hidden",
    },
    image: { width: "100%", height: width * 0.5 },
    cardContent: { padding: 12 },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
    summary: { color: "#666", marginBottom: 10, lineHeight: 18 },
    button: {
        backgroundColor: "#111",
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "600" },

    // 빈 리스트 안내
    emptyText: { textAlign: "center", marginTop: 40, color: "#888" },
    floatingButton: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        backgroundColor: 'white',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    cardContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: height,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 0,
    },
    dragHandle: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    dragBar: {
        width: 50,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#ccc',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        padding: 12,
        margin: 12,
        backgroundColor: '#f7f7f7',
    },
    answerScroll: {
        flex: 1,
        paddingHorizontal: 12,
    },
    answerCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#e6f0ff',
        marginTop: 8,
    },
});

export default MemeDictionaryComponent;
