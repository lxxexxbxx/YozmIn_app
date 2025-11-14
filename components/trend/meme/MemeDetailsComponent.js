import React, {useEffect, useState} from "react";
import {View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { Image as ExpoImage } from "expo-image";
import { SvgXml } from "react-native-svg";
import YoutubeTrendingShorts from "../youtubeShorts/YoutubeTrendingShorts";
import TypingText from "../../chatbot/TypingText";

const { width } = Dimensions.get("window");

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

const InfoTab = ({ meme }) => {
    console.log(meme);
    return (
        <ScrollView style={{ padding: 16 }}>
            <Text style={styles.title}>{meme.title}</Text>
            <Text style={styles.meta}>
                {meme.year} {meme.month ? `${meme.month}월` : ""}
            </Text>
            <MemeImage uri={meme.image} style={styles.image} />
            <View style={styles.bubbleContainer}>
                <TypingText style={styles.desc} fullText={meme.desc || meme.summary} speed={15} />
            </View>
        </ScrollView>
    );
}

const ShortsTab = ({ meme }) => (
    <View style={{ flex: 1 }}>
        <YoutubeTrendingShorts keyword={meme.title} />
    </View>
);

const MemeDetailsComponent = ({ meme }) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: "info", title: "정보" },
        { key: "shorts", title: "쇼츠" },
    ]);

    const renderScene = SceneMap({
        info: () => <InfoTab meme={meme} />,
        shorts: () => <ShortsTab meme={meme} />,
    });

    return (
        <View style={{ flex: 1 }}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: "#dc143c" }}
                        style={{ backgroundColor: "#111" }}
                        labelStyle={{ color: "#111", fontWeight: "700" }}
                    />
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    title: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
    meta: { color: "#888", marginBottom: 10 },
    image: { width: "100%", height: width * 0.5, borderRadius: 8, marginBottom: 12 },
    desc: { fontSize: 15, color: "#444", lineHeight: 22, paddingHorizontal: 15, paddingVertical: 10, },
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
    bubbleContainer: {
        // maxWidth: "95%",
        marginVertical: 4,
        padding: 5,
        borderRadius: 12,
        backgroundColor: "#fff",
        alignSelf: "center",
    },
});

export default MemeDetailsComponent;
