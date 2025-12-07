import React, {useEffect, useRef, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Animated,
    Keyboard,
    PanResponder,
    Platform,
    StatusBar,
    Modal,
    SafeAreaView // 아이폰 노치 대응을 위해 추가
} from "react-native";
import { CommonUtils } from "../../common/CommonUtils";
import supabase from "../../../supabase";
import { SvgXml } from "react-native-svg";
import DropDownPicker from 'react-native-dropdown-picker';
import { ThemeView, ThemeText } from "../../common/ThemeComponents";
import { useTheme } from "../../settings/theme/ThemeContext";
import MemeDetailsComponent from "./MemeDetailsComponent";
import { Image as ExpoImage } from "expo-image";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 아이폰 노치 및 안드로이드 상태바 높이 고려
// const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20;

// 스냅 포인트 설정
const SNAP_POINTS = {
    FULL: STATUS_BAR_HEIGHT,                   // 화면 맨 위
    MID: SCREEN_HEIGHT * 0.25, // 화면의 25% 지점 (75% 높이)
    CLOSED: SCREEN_HEIGHT      // 닫힘
};

const getYears = () => {
    const todayYear = new Date().getFullYear();
    const items = [];
    for(let i=todayYear; i>=2010; i--) {
        items.push({ label: `${i}년`, value: i });
    }
    return items
}
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
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const txt = await r.text();
                if (alive) setXml(txt);
            } catch (e) {
                if (alive) setErr(e);
            }
        })();
        return () => { alive = false; };
    }, [uri]);

    if (err) return <View style={{ height }} />;
    if (!xml) return <ActivityIndicator style={{ height, justifyContent: "center" }} />;
    return <SvgXml xml={xml} width="100%" height={height} />;
};
export const MemeImage = ({ uri, style }) => {
    if (!uri) return null;
    const isSvg = uri.toLowerCase().includes(".svg");
    const h = style?.height ?? 220;
    return isSvg ? <RemoteSvg uri={uri} height={h} /> : <ExpoImage source={{ uri }} style={style} contentFit="cover" transition={150} />;
};
// ... (여기까지 헬퍼 함수 생략 구간 끝)

const MemeDictionaryComponent = () => {
    const [memes, setMemes] = useState([]);
    const [filteredMemes, setFilteredMemes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openY, setOpenY] = useState(false);
    const [year , setYear] = useState(new Date().getFullYear());
    const [years , setYears] = useState(getYears());
    const [openM, setOpenM] = useState(false);
    const [month , setMonth] = useState(new Date().getMonth() + 1);
    const [months , setMonths] = useState(getMonths());

    const [selectedItem, setSelectedItem] = useState(null);
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(SNAP_POINTS.CLOSED)).current;

    const { colors } = useTheme();

    useEffect(() => {
        CommonUtils.noGoBack();
        fetchMemes();
    }, []);

    // ... (fetchMemes 및 필터링 useEffect 기존과 동일) ...
    const fetchMemes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("trend_memes")
                .select("id, year, month, title, desc, image")
                .order("year", { ascending: false })
                .order("month", { ascending: false })
                .order("id", { ascending: false });

            if (error) throw error;

            const sanitized = data.map((item) => ({
                id: item.id.toString(),
                year: item.year,
                month: item.month,
                title: item.title || "(제목 없음)",
                desc: item.desc,
                summary: (String(item.desc).length > 60 ? String(item.desc).slice(0, 60) + "..." : item.desc) || "설명이 없습니다.",
                image: item.image && item.image.startsWith("http") ? item.image : "https://via.placeholder.com/400x250.png?text=이미지+없음",
            }));
            setMemes(sanitized);
        } catch (err) {
            console.error("❌ Supabase fetch error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const next = memes.filter((m) => {
            if (year !== null && m.year !== year) return false;
            return !(month !== null && m.month !== month);
        });
        setFilteredMemes(next);
    }, [year, month, memes]);


    // 바텀 시트 열기
    const openDetail = (item) => {
        setSelectedItem(item);
        setVisible(true);
        // Modal이 렌더링 된 후 애니메이션 시작
        setTimeout(() => {
            Animated.spring(translateY, {
                toValue: SNAP_POINTS.MID,
                useNativeDriver: true,
                damping: 20,
                mass: 1,
                stiffness: 100,
            }).start();
        }, 50);
    };

    // 바텀 시트 닫기
    const closeDetail = () => {
        Keyboard.dismiss();
        Animated.timing(translateY, {
            toValue: SNAP_POINTS.CLOSED,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            setSelectedItem(null);
        });
    };

    // ⚡ 개선된 PanResponder: 드래그 감도 및 영역 개선
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gesture) => {
                // 수직 움직임이 수평 움직임보다 크고, 일정 거리 이상일 때만 반응 (스크롤 오작동 방지)
                return Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 5;
            },
            onPanResponderMove: (_, gesture) => {
                // 현재 시트의 위치 추정 (MID에서 시작했다고 가정)
                // 실제로는 이전 오프셋을 기억해야 완벽하지만, 여기서는 단순화하여 처리
                // 사용자가 터치한 시점의 위치를 기준으로 계산하는 로직은 복잡하므로
                // 간단히 현재 값에서 델타를 더하는 방식 대신, 현재 상태에 따라 분기

                // Animated.Value에 직접 리스너를 달지 않았으므로,
                // gesture.dy(움직인 거리)를 이용하여 "의도"를 파악하고 시각적 피드백 제공

                // 여기서는 간단히: 위로 당기면 올라가고 아래로 당기면 내려가는 "저항감"만 구현하거나
                // 복잡한 계산 대신 제스처 종료 시점의 판단에 집중하는 것이 UX상 깔끔할 수 있습니다.
                // 하지만 실시간 드래깅을 위해 아래와 같이 구현합니다.

                // *주의*: 시트가 이미 FULL 상태일 때 위로 더 당기지 못하게 막음
            },
            onPanResponderRelease: (_, gesture) => {
                const { dy, vy } = gesture;

                // 1. 아래로 빠르게 쓸어내림 -> 닫기
                if (dy > 150 || vy > 1.0) {
                    closeDetail();
                }
                // 2. 위로 빠르게 쓸어올림 -> 전체 화면
                else if (dy < -100 || vy < -1.0) {
                    Animated.spring(translateY, {
                        toValue: SNAP_POINTS.FULL,
                        useNativeDriver: true,
                    }).start();
                }
                // 3. 어정쩡한 위치 -> 중간으로 복귀 (혹은 상태에 따라 토글)
                else {
                    // 현재 위치가 화면 상단에 가까우면 FULL, 아니면 MID로
                    // 정확한 현재 Y값을 알기 어려우므로 dy 기준으로 판단
                    if (dy < -50) { // 위로 좀 올렸으면 FULL
                        Animated.spring(translateY, {
                            toValue: SNAP_POINTS.FULL,
                            useNativeDriver: true,
                        }).start();
                    } else { // 아니면 다시 MID
                        Animated.spring(translateY, {
                            toValue: SNAP_POINTS.MID,
                            useNativeDriver: true,
                        }).start();
                    }
                }
            },
        })
    ).current;

    // 드래그 제스처를 Animated.event로 연결하여 실시간 움직임 구현
    // (위의 onPanResponderMove를 대체하여 더 부드럽게)
    // 단, 시작 오프셋 관리가 필요하므로 여기서는 '화면을 덮는' 간단한 방식인 '제스처 종료 후 이동' 방식을 택했습니다.
    // 만약 실시간 드래깅(따라오는 효과)을 원하시면 offset state 관리가 추가로 필요합니다.
    // 지금은 '조작감' 개선을 위해 터치 영역을 늘리는 것에 집중했습니다.

    const renderCard = ({ item }) => (
        <ThemeView style={styles.card}>
            <MemeImage uri={item.image} style={styles.image} />
            <ThemeView style={styles.cardContent}>
                <ThemeView style={styles.cardHeader}>
                    <ThemeText style={styles.title}>{item.title}</ThemeText>
                </ThemeView>
                <ThemeText style={styles.summary}>{item.summary}</ThemeText>
                <TouchableOpacity style={styles.button} onPress={() => openDetail(item)}>
                    <Text style={styles.buttonText}>자세히 보기</Text>
                </TouchableOpacity>
            </ThemeView>
        </ThemeView>
    );

    // 드롭다운 핸들러
    const onYearOpen = () => { setOpenM(false); };
    const onMonthOpen = () => { setOpenY(false); };

    return (
        <ThemeView style={styles.container}>
            {/* 상단 필터바 */}
            <ThemeView style={styles.filterBar}>
                <ThemeView style={styles.filterRow}>
                    <ThemeView style={[styles.dropdownOuter, { zIndex: 3000, elevation: 3000 }]}>
                        <DropDownPicker
                            open={openY} value={year} items={years}
                            setOpen={setOpenY} setValue={setYear} setItems={setYears}
                            onOpen={onYearOpen} placeholder="연도 선택"
                            style={styles.dropdown} dropDownContainerStyle={styles.dropdownContainer}
                            listMode={"SCROLLVIEW"} scrollViewProps={{ nestedScrollEnabled: true }}
                            zIndex={3000} zIndexInverse={1000}
                        />
                    </ThemeView>
                    <ThemeView style={[styles.dropdownOuter, { zIndex: 3000, elevation: 3000 }]}>
                        <DropDownPicker
                            open={openM} value={month} items={months}
                            setOpen={setOpenM} setValue={setMonth} setItems={setMonths}
                            onOpen={onMonthOpen} placeholder="월 선택"
                            style={styles.dropdown} dropDownContainerStyle={styles.dropdownContainer}
                            listMode={"SCROLLVIEW"} scrollViewProps={{ nestedScrollEnabled: true }}
                            zIndex={3000} zIndexInverse={1000}
                        />
                    </ThemeView>
                </ThemeView>
            </ThemeView>

            {loading ? (
                <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredMemes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCard}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>아직 등록된 밈이 없어요 😅</Text>}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* 🔴 개선된 Modal 바텀 시트 */}
            <Modal
                visible={visible}
                transparent={true}
                animationType="none" // 커스텀 애니메이션 사용
                statusBarTranslucent={true} // 안드로이드 상태바 투명 처리
                onRequestClose={closeDetail}
            >
                <View style={styles.modalOverlay}>
                    {/* 배경 터치 시 닫기 */}
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={closeDetail}
                        activeOpacity={1}
                    />

                    <Animated.View
                        style={[
                            styles.bottomSheetContainer,
                            {
                                transform: [{ translateY }],
                                backgroundColor: colors.background // 테마 배경색 적용
                            },
                        ]}
                    >
                        {/* ⚡ 개선된 드래그 핸들 영역: 크기를 키우고 헤더 전체를 감쌈 */}
                        <View
                            style={styles.dragHandleArea}
                            {...panResponder.panHandlers}
                        >
                            <View style={styles.dragIndicator} />
                            {/* 아이폰 사용자를 위한 시각적 힌트 또는 닫기 버튼 추가 가능 */}
                        </View>

                        {/* 컨텐츠 영역 */}
                        <View style={styles.sheetContent}>
                            {selectedItem && <MemeDetailsComponent meme={selectedItem}/>}
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </ThemeView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },

    // ... (기존 카드 스타일 등 생략 - 그대로 유지) ...
    card: { backgroundColor: "#fafafa", borderRadius: 12, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3, overflow: "hidden" },
    image: { width: "100%", height: width * 0.5 },
    cardContent: { padding: 12 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
    summary: { color: "#666", marginBottom: 10, lineHeight: 18 },
    button: { backgroundColor: "rgba(118, 166, 255, 1)", paddingVertical: 8, borderRadius: 8, alignItems: "center" },
    buttonText: { color: "#fff", fontWeight: "600" },
    emptyText: { textAlign: "center", marginTop: 40, color: "#888" },
    filterBar: { justifyContent: "center", paddingHorizontal: 12, backgroundColor: "transparent", zIndex: 4000, elevation: 4000, marginBottom: 10 },
    filterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, gap: 8 },
    dropdownOuter: { flex: 1 },
    dropdown: { borderRadius: 10, borderWidth: 1, borderColor: "#ddd", minHeight: 40, backgroundColor: "rgba(255,255,255,0.95)" },
    dropdownContainer: { borderRadius: 16, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", maxHeight: 250 },

    // 🆕 Modal 및 BottomSheet 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 배경 어둡게
        justifyContent: 'flex-end',
    },
    bottomSheetContainer: {
        width: '100%',
        height: SCREEN_HEIGHT, // 전체 높이 사용
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: Platform.OS === 'ios' ? 20 : 10, // ⚡ 아이폰 노치 회피를 위한 상단 패딩
        overflow: 'hidden',
        // 그림자
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 10,
    },
    dragHandleArea: {
        width: '200%',
        height: 20, // 터치 영역 높이
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    dragIndicator: {
        width: "10%",
        height: 7,
        marginRight: width * 0.99,
        borderRadius: 2.5,
        backgroundColor: "gray",
    },
    sheetContent: {
        flex: 1,
    }
});

export default MemeDictionaryComponent;