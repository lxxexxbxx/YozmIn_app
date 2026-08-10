// HotPlaceScreen.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
} from "react-native";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import axios from "axios";
import { useKeyStore } from "../../../stores/KeyStore";
import { ThemeView, ThemeText } from "../../common/ThemeComponents";
import { useTheme } from "../../settings/theme/ThemeContext";

const SEARCH_RADIUS_M = 3000;
const TARGET_AGE_VECTOR = [0.05, 0.45, 0.35, 0.1, 0.05];
const EPS = 1e-9;

/** 유틸 함수들 */
function congestionScore(c) {
    return c === "여유" ? +0.1 : c === "붐빔" ? -0.15 : 0;
}
function distanceDecay(km, lambda = 0.35) {
    return Math.exp(-lambda * (km || 0));
}
function cosineSim(u, v) {
    if (!u?.length || !v?.length || u.length !== v.length) return 0;
    let dot = 0, nu = 0, nv = 0;
    for (let i = 0; i < u.length; i++) {
        const a = u[i] || 0, b = v[i] || 0;
        dot += a * b;
        nu += a * a;
        nv += b * b;
    }
    return dot / (Math.sqrt(nu) * Math.sqrt(nv) + EPS);
}
function congestionColor(c) {
    return c === "여유" ? "#1db954" : c === "붐빔" ? "#e53935" : "#f5a623";
}
function scoreColor(score) {
    if (score >= 80) return "#1db954";
    if (score < 50) return "#e53935";
    return "#f5a623";
}
const WEIGHTS = {
    cafe: { wR: 0.3, wQ: 0.25, wP: 0.1, wT: 0.1, wD: 0.1, wA: 0.1, wC: 0.05, alpha: 0.5 },
    food: { wR: 0.3, wQ: 0.25, wP: 0.1, wT: 0.1, wD: 0.1, wA: 0.1, wC: 0.05, alpha: 0.5 },
    tour: { wR: 0.1, wQ: 0.1, wP: 0.3, wT: 0.2, wD: 0.15, wA: 0.1, wC: 0.05, alpha: 0.4 },
};

async function kakaoSearchKeyword(category, userLocation) {
    const KAKAO_REST_API_KEY = useKeyStore.getState().KAKAO_REST_API_KEY;
    const keyword = category === "cafe" ? "카페" : category === "food" ? "맛집" : "관광명소";
    const url = "https://dapi.kakao.com/v2/local/search/keyword.json";
    const params = {
        query: keyword,
        x: userLocation.lng,
        y: userLocation.lat,
        radius: SEARCH_RADIUS_M,
        size: 15,
        sort: "accuracy",
    };
    const headers = { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` };
    const { data } = await axios.get(url, { params, headers });
    return (data.documents || []).map((d) => ({
        id: d.id,
        name: d.place_name,
        lat: parseFloat(d.y),
        lng: parseFloat(d.x),
        category,
        openNow: true,
        distanceKm: d.distance ? Number(d.distance) / 1000 : undefined,
    }));
}

async function naverTrendEnrich(places) {
    const NAVER_CLIENT_ID = useKeyStore.getState().NAVER_CLIENT_ID;
    const NAVER_CLIENT = useKeyStore.getState().NAVER_CLIENT;
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT) return places;
    try {
        const headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT,
            "Content-Type": "application/json",
        };
        const url = "https://openapi.naver.com/v1/datalab/search";
        const bodyBase = {
            startDate: "2025-09-01",
            endDate: "2025-09-21",
            timeUnit: "date",
            keywordGroups: places.slice(0, 5).map((p) => ({ groupName: p.name, keywords: [p.name] })),
        };
        const resAll = await axios.post(url, { ...bodyBase }, { headers });
        const trendMap = {};
        (resAll.data?.results || []).forEach((r) => {
            const last = r.data?.[r.data.length - 1]?.ratio ?? 50;
            trendMap[r.title || r.groupName] = last;
        });
        return places.map((p) => ({
            ...p,
            trend: trendMap[p.name] ?? 50,
            ageVector: TARGET_AGE_VECTOR,
            gender: { male: 0.5, female: 0.5 },
            congestion: ["여유", "보통", "붐빔"][Math.floor(Math.random() * 3)],
        }));
    } catch (e) {
        console.warn("NAVER trend enrich failed:", e?.message);
        return places;
    }
}

function calcScore(p, category, includeCongestion) {
    const W = WEIGHTS[category];
    const Rn = Math.log(1 + (p.reviews ?? 0)) / Math.log(1 + 5000);
    const Qn = (p.rating ?? 0) / 5;
    const Pn = (p.population ?? 50) / 100;
    const Tn = (p.trend ?? 50) / 100;
    const Dn = distanceDecay(p.distanceKm ?? 1.5);
    const An = cosineSim(TARGET_AGE_VECTOR, p.ageVector ?? TARGET_AGE_VECTOR);
    const G = p.gender ? p.gender.female * 1.2 + p.gender.male * 0.8 : 1;
    const Cn = includeCongestion ? congestionScore(p.congestion) : 0;
    const O = p.openNow === false ? 0.8 : 1.0;
    const base =
        W.wR * Rn +
        W.wQ * Qn +
        W.wP * Pn +
        W.wT * Tn +
        W.wD * Dn +
        W.wA * An +
        W.wC * Cn;
    return Math.min(100, Math.max(0, base * G * (1 + W.alpha * Cn) * O * 100));
}

export default function HotPlaceScreen() {
    const KAKAO_JS_KEY = useKeyStore.getState().KAKAO_JS_KEY;
    const { colors, isDark } = useTheme();

    const [category, setCategory] = useState("tour");
    const [includeCongestion, setIncludeCongestion] = useState(true);
    const [openOnly, setOpenOnly] = useState(true);
    const [loading, setLoading] = useState(false);
    const [places, setPlaces] = useState([]);
    const [userLocation, setUserLocation] = useState(null);

    const snapPoints = useMemo(() => ["25%", "60%", "90%"], []);
    const sheetRef = useRef(null);

    const refreshLocation = useCallback(async () => {
        try {
            setLoading(true);
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("위치 권한 필요", "앱 설정에서 위치 권한을 허용해주세요.");
                setLoading(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch (e) {
            console.error(e);
            Alert.alert("오류", "위치를 가져오지 못했습니다.");
            setLoading(false);
        }
    }, []);

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'REFRESH_LOCATION') {
                refreshLocation();
            }
        } catch (e) {
            console.warn("WebView message parse error", e);
        }
    };

    useEffect(() => {
        refreshLocation();
    }, [refreshLocation]);

    useEffect(() => {
        if (!userLocation) return;
        (async () => {
            try {
                setLoading(true);
                let list = await kakaoSearchKeyword(category, userLocation);
                list = list.map((p) => ({
                    ...p,
                    rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
                    reviews: Math.floor(Math.random() * 3000),
                    openNow: true,
                    distanceKm: p.distanceKm ?? Math.random() * 3 + 0.5,
                }));
                list = await naverTrendEnrich(list);
                const scored = list.map((p) => ({
                    ...p,
                    score: calcScore(p, category, includeCongestion),
                }));
                const sorted = scored.sort(
                    (a, b) =>
                        (b.score ?? 0) - (a.score ?? 0) ||
                        (b.rating ?? 0) - (a.rating ?? 0) ||
                        (b.reviews ?? 0) - (a.reviews ?? 0) ||
                        (a.distanceKm ?? 0) - (b.distanceKm ?? 0)
                );
                setPlaces(sorted);
            } catch (e) {
                console.error(e?.message || e);
                Alert.alert("오류", "데이터를 불러오는 중 문제가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        })();
    }, [category, includeCongestion, openOnly, userLocation]);

    const renderHeader = useCallback(
        () => (
            <ThemeView>
                <ThemeView style={{ marginTop: 8, marginBottom: 8 }}>
                    <ThemeText style={{ fontSize: 18, fontWeight: 'bold' }}>내 주변 핫플레이스</ThemeText>
                </ThemeView>
                <ThemeView style={styles.tabs}>
                    {["tour", "cafe", "food"].map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.tab,
                                {
                                    backgroundColor:
                                        category === cat
                                            ? isDark ? "#FFFFFF22" : "#00000015"
                                            : colors.boxBackground,
                                    borderWidth: 1,
                                    borderColor:
                                        category === cat
                                            ? isDark ? "#AAAAAA" : "#333333"
                                            : colors.border,
                                },
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <ThemeText
                                style={{
                                    color: category === cat ? colors.text : colors.subText,
                                    fontWeight: "600",
                                }}
                            >
                                {cat === "tour" ? "관광/명소" : cat === "cafe" ? "카페" : "음식"}
                            </ThemeText>
                        </TouchableOpacity>
                    ))}
                </ThemeView>
                <ThemeView style={styles.switchRow}>
                    <ThemeText>혼잡도 고려</ThemeText>
                    <Switch value={includeCongestion} onValueChange={setIncludeCongestion} />
                    <ThemeText>영업중만</ThemeText>
                    <Switch value={openOnly} onValueChange={setOpenOnly} />
                </ThemeView>
            </ThemeView>
        ),
        [category, includeCongestion, openOnly, colors, isDark]
    );

    const renderItem = useCallback(
        ({ item }) => (
            <ThemeView
                style={[
                    styles.card,
                    { backgroundColor: colors.background, borderColor: colors.border },
                ]}
            >
                <ThemeView style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <ThemeText style={styles.cardTitle}>{item.name}</ThemeText>
                    <ThemeView style={[styles.badge, { backgroundColor: congestionColor(item.congestion) }]}>
                        <ThemeText style={styles.badgeText}>{item.congestion ?? "-"}</ThemeText>
                    </ThemeView>
                </ThemeView>
                <ThemeText style={styles.meta}>⭐ {item.rating ?? "-"} · 리뷰 {item.reviews ?? "-"}</ThemeText>
                <ThemeText style={styles.meta}>인기도: {item.trend ?? "-"}</ThemeText>
                <ThemeText style={styles.meta}>
                    거리: {item.distanceKm?.toFixed?.(1) ?? item.distanceKm ?? "-"} km
                </ThemeText>
                <ThemeText style={[styles.score, { color: scoreColor(item.score ?? 0) }]}>
                    추천점수: {item.score?.toFixed(1)}점 / 100점
                </ThemeText>
            </ThemeView>
        ),
        [colors]
    );

    const mapHtml = `
    <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        .my-loc-label { 
            padding: 4px 8px; 
            background-color: #333; 
            color: #fff; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: bold;
            white-space: nowrap;
            transform: translateY(-50px);
        }
        /* 버튼 스타일 */
        .custom-control {
            position: absolute;
            bottom: 28%; /* 1/4 지점보다 살짝 위 */
            right: 20px;
            z-index: 9999;
            background: white;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 1px solid #ddd;
        }
        .custom-control:active {
            background: #f0f0f0;
        }
      </style>
    </head><body>
      <div id="map"></div>
      
      <div class="custom-control" onclick="reqLocation()">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="12" y1="2" x2="12" y2="4"></line>
            <line x1="12" y1="20" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="4" y2="12"></line>
            <line x1="20" y1="12" x2="22" y2="12"></line>
            <circle cx="12" cy="12" r="3" fill="#333" stroke="none"></circle>
        </svg>
      </div>

      <script>
        const container = document.getElementById("map");
        const options = {
            center: new kakao.maps.LatLng(${userLocation?.lat ?? 37.5665}, ${userLocation?.lng ?? 126.9780}),
            level: 5
        };
        const map = new kakao.maps.Map(container, options);

        function reqLocation() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REFRESH_LOCATION' }));
            }
        }

        const userLat = ${userLocation?.lat ?? 0};
        const userLng = ${userLocation?.lng ?? 0};
        
        if (userLat !== 0 && userLng !== 0) {
            const userPos = new kakao.maps.LatLng(userLat, userLng);
            const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
            const imageSize = new kakao.maps.Size(24, 35); 
            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize); 
            
            new kakao.maps.Marker({
                position: userPos,
                map: map,
                image: markerImage,
                zIndex: 9999 
            });

            new kakao.maps.CustomOverlay({
                position: userPos,
                content: '<div class="my-loc-label">내 위치</div>',
                map: map
            });
        }

        const places = ${JSON.stringify(places)};
        const bounds = new kakao.maps.LatLngBounds();

        if (userLat !== 0 && userLng !== 0) {
            bounds.extend(new kakao.maps.LatLng(userLat, userLng));
        }

        places.forEach(function(p){
          const pos = new kakao.maps.LatLng(p.lat, p.lng);
          bounds.extend(pos);
          const marker = new kakao.maps.Marker({ position: pos, map: map });
          
          const content =
            '<div style="padding:6px 8px;font-size:12px;line-height:1.4; color:#000;">'
            + '<b>' + (p.name||'') + '</b><br/>'
            + '⭐' + (p.rating||'-') + ' · 리뷰 ' + (p.reviews||'-') + '<br/>'
            + '혼잡도 ' + (p.congestion||'-') + ' · 점수 ' + (p.score? p.score.toFixed(1) : '-') + '점<br/>'
            + '<a href="https://map.kakao.com/link/to/'+encodeURIComponent(p.name)+','+p.lat+','+p.lng+'" target="_blank" style="color:blue;">길찾기</a>'
            + '</div>';
            
          const iw = new kakao.maps.InfoWindow({ content: content });
          kakao.maps.event.addListener(marker, 'click', function(){ iw.open(map, marker); });
        });

        if (places.length > 0) {
            map.setBounds(bounds);
        }
      </script>
    </body></html>
  `;

    return (
        <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>
            <WebView
                originWhitelist={["*"]}
                source={{ html: mapHtml }}
                style={StyleSheet.absoluteFillObject}
                onMessage={handleWebViewMessage}
            />
            {loading && (
                <ThemeView style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.text} />
                    <ThemeText style={{ marginTop: 8 }}>추천 계산 중…</ThemeText>
                </ThemeView>
            )}
            <BottomSheet
                ref={sheetRef}
                index={0}
                snapPoints={snapPoints}
                backgroundStyle={{ backgroundColor: colors.boxBackground }}
                handleIndicatorStyle={{ backgroundColor: colors.subText }}
            >
                <BottomSheetFlatList
                    style={{ backgroundColor: colors.background }}
                    data={places}
                    keyExtractor={(item) => String(item.id)}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator
                />
            </BottomSheet>
        </ThemeView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: { flexDirection: "row", gap: 8, marginVertical: 8 },
    tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 8,
    },
    card: {
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    cardTitle: { fontSize: 16, fontWeight: "700" },
    meta: { marginTop: 4 },
    score: { marginTop: 6, fontWeight: "700", fontSize: 15 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    badgeText: { fontWeight: "700" },
    centered: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
});