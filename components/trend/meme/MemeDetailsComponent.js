import React, {useEffect, useState} from "react";
import {View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { Image as ExpoImage } from "expo-image";
import { SvgXml } from "react-native-svg";
import YoutubeTrendingShorts from "../youtubeShorts/YoutubeTrendingShorts";
import TypingText from "../../chatbot/TypingText";
import { ThemeView, ThemeText } from "../../common/ThemeComponents";
import { useTheme } from "../../settings/theme/ThemeContext";

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
    const {colors} = useTheme();

    return (
        <ScrollView style={{ padding: 16 }}>
            <ThemeText style={styles.title}>{meme.title}</ThemeText>
            <ThemeText style={styles.meta}>
                {`${meme.year}년`} {meme.month ? `${meme.month}월` : ""}
            </ThemeText>
            <MemeImage uri={meme.image} style={styles.image} />
            <ThemeView style={[styles.bubbleContainer, {borderColor: colors.text}]}>
                <TypingText style={{color: colors.text}} fullText={meme.desc || meme.summary} speed={15} />
            </ThemeView>
        </ScrollView>
    );
}

const ShortsTab = ({ meme }) => (
    <ThemeView style={{ flex: 1 }}>
        <YoutubeTrendingShorts keyword={meme.title} />
    </ThemeView>
);

const MemeDetailsComponent = ({ meme }) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: "info", title: "정보" },
        { key: "shorts", title: "쇼츠" },
    ]);
    const {colors} = useTheme();

    const renderScene = SceneMap({
        info: () => <InfoTab meme={meme} />,
        shorts: () => <ShortsTab meme={meme} />,
    });

    return (
        <ThemeView style={{ flex: 1 }}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: "rgba(118, 166, 255, 1)" }}
                        style={{ backgroundColor: colors.background }}
                        labelStyle={{ color: colors.text, fontWeight: "700" }}
                        activeColor={ colors.text }
                        inactiveColor={'gray'}
                    />
                )}
            />
        </ThemeView>
    );
};

const styles = StyleSheet.create({
    title: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
    meta: { marginBottom: 10 },
    image: { width: "100%", height: width * 0.5, borderRadius: 8, marginBottom: 12 },
    container: { flex: 1, backgroundColor: "#fff" },

    bubbleContainer: {
        padding: 20,
        borderWidth: 1,
        borderRadius: 12,
        alignSelf: "center",
    },
});

export default MemeDetailsComponent;
