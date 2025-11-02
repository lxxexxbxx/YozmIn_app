// NewsDetailComponent.js

import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';


import { fetchCrawledNewsContent } from './NewsAPI/NaverNewsDetailAPIComponent'; // 1. 크롤링 함수 임포트
import {fetchNewsDetails, extractKeywordFromTitle, reextractKeyword} from './NewsAPI/GeminiAPIDetailComponent';          // 2. Gemini 요약 함수 임포트

export default function NewsDetailComponent() {
    // --- React Navigation Hooks ---
    const navigation = useNavigation();
    const route = useRoute();
    const { keyword } = route.params; // `keyword`는 뉴스 제목(title)입니다.

    // --- Component State ---
    const [newsDetail, setNewsDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    // ⭐️ 로딩 메시지를 동적으로 변경하기 위한 state 추가
    const [loadingMessage, setLoadingMessage] = useState('AI가 뉴스를 분석하고 있습니다... 🤖');

    // --- Typing Animation State ---
    const [backgroundDisplay, setBackgroundDisplay] = useState('');
    const [summaryDisplay, setSummaryDisplay] = useState('');

    // --- useEffect Hooks ---
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: undefined });
        };
    }, [navigation]);


    useEffect(() => {
        const getNewsDetails = async () => {
            if (keyword) { // `keyword`는 "정부 전산망 마비..." 같은 긴 원본 제목입니다.
                setLoading(true);

                // --- 1단계: 긴 제목에서 핵심 키워드 추출 ---
                setLoadingMessage('핵심 키워드를 추출하고 있어요... 🧠');
                const searchKeyword = await extractKeywordFromTitle(keyword);

                if (!searchKeyword) {
                    console.error("키워드 추출 실패. 작업을 중단합니다.");
                    setLoading(false);
                    return;
                }

                // --- 2단계: 추출된 키워드로 뉴스 기사 크롤링 ---
                let crawledContent = null;

                for (let attempt = 1; attempt <= 3 && !crawledContent; attempt++) {
                    setLoadingMessage(
                        `'${searchKeyword}'(으)로 뉴스를 찾고 있어요... 🔍 (시도 ${attempt}/3)`
                    );

                    try {
                        // 1) 원 키워드로 시도
                        crawledContent = await fetchCrawledNewsContent(searchKeyword);

                        // 2) 실패 시 키워드 보정 후 재시도
                        if (!crawledContent) {
                            console.warn(`크롤링 실패(원 키워드). 재보정 시도 ${attempt}/3`);
                            const newSearchKeyword = await reextractKeyword(searchKeyword);

                            if (newSearchKeyword && newSearchKeyword !== searchKeyword) {
                                setLoadingMessage(
                                    `키워드를 보정했어요: '${newSearchKeyword}'로 재검색 중... 🔎`
                                );
                                crawledContent = await fetchCrawledNewsContent(newSearchKeyword);
                            }
                        }
                    } catch (e) {
                        console.error(`크롤링 중 오류 (시도 ${attempt}/3):`, e);
                    }

                    // 3) 다음 시도 전 짧은 백오프
                    if (!crawledContent && attempt < 3) {
                        await new Promise((r) => setTimeout(r, 800));
                    }
                }

                if (!crawledContent) {
                    console.error("🚨 크롤링 3회 실패. 작업을 중단합니다.");
                    setNewsDetail(null);
                    setLoading(false);
                    return;
                }

                // --- 3단계: 크롤링 본문과 '원본 제목'으로 최종 요약 요청 ---
                setLoadingMessage('AI가 기사를 읽고 요약하는 중... 🤖');
                // ⭐️ fetchNewsDetails에는 원본 제목(keyword)을 그대로 전달합니다.
                const rawText = await fetchNewsDetails(crawledContent, keyword);

                // ... 이하 JSON 파싱 및 state 설정 로직은 동일 ...
                if (rawText && typeof rawText === 'string') {
                    try {
                        const startIndex = rawText.indexOf('{');
                        const endIndex = rawText.lastIndexOf('}');
                        if (startIndex > -1 && endIndex > -1) {
                            const jsonString = rawText.substring(startIndex, endIndex + 1);
                            const parsedDetails = JSON.parse(jsonString);
                            setNewsDetail(parsedDetails);
                        } else {
                            setNewsDetail(null);
                        }
                    } catch (error) {
                        console.error("🚨 NewsDetailComponent에서 JSON 파싱 오류:", error);
                        setNewsDetail(null);
                    }
                } else {
                    setNewsDetail(null);
                }
                setLoading(false);
            }
        };
        getNewsDetails();
    }, [keyword]);

    useEffect(() => {
        if (newsDetail) {
            startTyping(newsDetail.background_info, setBackgroundDisplay, 30);
            startTyping(newsDetail.summary, setSummaryDisplay, 50);
        }
    }, [newsDetail]);

    // --- Helper Functions ---
    const startTyping = (fullText, setter, speed = 40) => {
        if (typeof fullText !== 'string' || !fullText) return;

        setter(''); // 텍스트를 비우는 것은 동일
        let currentLength = 1; // ⭐️ 인덱스 대신 길이를 기준으로 시작 (1부터)

        const interval = setInterval(() => {
            if (currentLength <= fullText.length) {
                // ⭐️ 이전 값(prev)에 더하는 대신, 원본에서 직접 자릅니다.
                setter(fullText.substring(0, currentLength));
                currentLength++; // 길이를 1 늘립니다.
            } else {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval); // 클린업 함수는 동일
    };

    // --- Conditional Rendering ---
    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
                {/* ⭐️ 동적 로딩 메시지 표시 */}
                <Text style={styles.loadingText}>{loadingMessage}</Text>
            </SafeAreaView>
        );
    }

    if (!newsDetail) {
        return (
            <SafeAreaView style={styles.center}>
                <Text>뉴스 정보를 불러오지 못했습니다. 😢</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#007AFF' }}>{'← 뒤로가기'}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#007AFF' }}>{'← 뒤로가기'}</Text>
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>📰 {newsDetail.title}</Text>
                </View>
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionContent}>{newsDetail.content_summarize}</Text>
                </View>
                <View style={[styles.sectionContainer, { backgroundColor: '#fffbea' }]}>
                    <Text style={styles.sectionTitle}>📘 배경 지식</Text>
                    <Text style={styles.sectionContent}>{backgroundDisplay}</Text>
                </View>
                <View style={[styles.sectionContainer, { backgroundColor: '#e8f5e9' }]}>
                    <Text style={styles.sectionTitle}>📝 AI 요약</Text>
                    <Text style={styles.sectionContent}>{summaryDisplay}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f2' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#555' },
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    scrollView: { padding: 20, paddingBottom: 40 },
    titleContainer: { backgroundColor: '#e0f7fa', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    titleText: { fontSize: 22, fontWeight: 'bold', color: '#00796B', textAlign: 'center' },
    sectionContainer: { backgroundColor: '#ffffff', borderRadius: 10, padding: 15, marginBottom: 20, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    sectionContent: { fontSize: 15, color: '#444', lineHeight: 22 },
});