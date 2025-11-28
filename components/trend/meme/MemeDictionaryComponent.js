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
import DropDownPicker from 'react-native-dropdown-picker';
import { ThemeView, ThemeText } from "../../common/ThemeComponents";
import { useTheme } from "../../settings/theme/ThemeContext";

const { width, height } = Dimensions.get("window");
const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight : 0; // 휴대폰 상단 상태바 크기
const SNAP_POINTS = {
    FULL: 0 + statusBarHeight,             // 완전 확장
    MID: height * 0.25,   // 기본 위치
    CLOSED: height       // 완전 닫힘
};

// year 리스트
const getYears = () => {
    const todayYear = new Date().getFullYear();
    const items = [];
    for(let i=todayYear; i>=2010; i--) {
        items.push({ label: `${i}년`, value: i });
    }
    return items
}
// month 리스트
const getMonths = () => {
    const todayMonth = new Date().getMonth();
    const items = [];
    for(let i=todayMonth; i>=0; i--) {
        items.push({ label: `${i+1}월`, value: i+1 });
    }
    return items
}

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
    const [memes, setMemes] = useState([]);
    const [filteredMemes, setFilteredMemes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openY, setOpenY] = useState(false);
    const [year , setYear] = useState(new Date().getFullYear());
    const [years , setYears] = useState(getYears);
    const [openM, setOpenM] = useState(false);
    const [month , setMonth] = useState(new Date().getMonth() + 1);
    const [months , setMonths] = useState(getMonths());

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
                year: item.year,
                month: item.month,
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

    // 🔥 연/월/데이터가 바뀔 때마다 자동으로 필터링
    useEffect(() => {
        const next = memes.filter((m) => {
            if (year !== null && m.year !== year) return false;
            return !(month !== null && m.month !== month);

        });
        setFilteredMemes(next);
    }, [year, month, memes]);

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
        <ThemeView style={styles.card}>
            <MemeImage uri={item.image} style={styles.image} />
            <ThemeView style={styles.cardContent}>
                <ThemeView style={styles.cardHeader}>
                    <ThemeText style={styles.title}>{item.title}</ThemeText>
                </ThemeView>
                <ThemeText style={styles.summary}>{item.summary}</ThemeText>
                <TouchableOpacity style={styles.button} onPress={() => openDetail(item)}>
                    <ThemeText style={styles.buttonText}>자세히 보기</ThemeText>
                </TouchableOpacity>
            </ThemeView>
        </ThemeView>
    );

    // 드롭다운이 겹치지 않도록 onOpen 시 서로 닫기
    const onYearOpen = () => {
        setOpenM(false);
    };
    const onMonthOpen = () => {
        setOpenY(false);
    };

    return (
        <ThemeView style={styles.container}>
            {/* 상단 연도 탭바 */}
            <ThemeView style={styles.filterBar}>
                <ThemeView style={styles.filterRow}>
                    <ThemeView style={[styles.dropdownOuter, { zIndex: 3000, elevation: 3000 }]}>
                        <DropDownPicker
                            open={openY}
                            value={year}
                            items={years}
                            setOpen={setOpenY}
                            setValue={setYear}
                            setItems={setYears}
                            onOpen={onYearOpen}
                            placeholder="연도 선택"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            listMode={"SCROLLVIEW"}
                            scrollViewProps={{ nestedScrollEnabled: true }}
                            zIndex={3000}
                            zIndexInverse={1000}
                        />
                    </ThemeView>
                    <ThemeView style={[styles.dropdownOuter, { zIndex: 3000, elevation: 3000 }]}>
                        <DropDownPicker
                            open={openM}
                            value={month}
                            items={months}
                            setOpen={setOpenM}
                            setValue={setMonth}
                            setItems={setMonths}
                            onOpen={onMonthOpen}
                            placeholder="월 선택"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            listMode={"SCROLLVIEW"}
                            scrollViewProps={{ nestedScrollEnabled: true }}
                            zIndex={3000}
                            zIndexInverse={1000}
                        />
                    </ThemeView>
                </ThemeView>
            </ThemeView>

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
                    <ThemeView style={StyleSheet.absoluteFill}>
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
                            <ThemeView style={styles.dragHandle} {...panResponder.panHandlers}>
                                <View style={styles.dragBar} />
                            </ThemeView>

                            {selectedItem && <MemeDetailsComponent meme={selectedItem}/>}
                        </Animated.View>
                    </ThemeView>
                </Portal>
            )}
        </ThemeView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
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
    // 상단 필터 바
    filterBar: {
        justifyContent: "center",
        paddingHorizontal: 12,
        backgroundColor: "transparent",
        zIndex: 4000,
        elevation: 4000,
    },
    filterRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
        gap: 8,
    },
    dropdownOuter: {
        flex: 1,
    },
    dropdown: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        minHeight: 40,
        backgroundColor: "rgba(255,255,255,0.95)",
    },
    dropdownContainer: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        maxHeight: 250,
    },
});

export default MemeDictionaryComponent;
