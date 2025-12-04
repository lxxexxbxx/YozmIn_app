import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { fetchCrawledNewsContent } from './NewsAPI/NaverNewsDetailAPIComponent';
import { fetchNewsDetails, extractKeywordFromTitle, reextractKeyword } from './NewsAPI/GeminiAPIDetailComponent';
import { ThemeView, ThemeText, ThemeScrollView } from '../common/ThemeComponents';
import { useTheme } from '../settings/theme/ThemeContext';
import PageTitleComponent from '../common/PageTitleComponent';

import TypingText from '../chatbot/TypingText';

const normalizeText = (val) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.filter(Boolean).join('\n');
  try {
    return String(val);
  } catch {
    return '';
  }
};

export default function NewsDetailComponent() {
  const navigation = useNavigation();
  const route = useRoute();
  const { keyword } = route.params || {};

  const { colors, isDark } = useTheme();

  const [newsDetail, setNewsDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('AI가 뉴스를 분석하고 있습니다... 🤖');

  const [backgroundDisplay, setBackgroundDisplay] = useState('');
  const [summaryDisplay, setSummaryDisplay] = useState('');

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  useEffect(() => {
    const getNewsDetails = async () => {
      if (!keyword) return;

      setLoading(true);

      setLoadingMessage('핵심 키워드를 추출하고 있어요... 🧠');
      const searchKeyword = await extractKeywordFromTitle(keyword);
      if (!searchKeyword) {
        setLoading(false);
        return;
      }

      let crawledContent = null;
      for (let attempt = 1; attempt <= 3 && !crawledContent; attempt++) {
        setLoadingMessage(`'${searchKeyword}'(으)로 뉴스를 찾고 있어요... 🔍 (시도 ${attempt}/3)`);
        try {
          crawledContent = await fetchCrawledNewsContent(searchKeyword);
          if (!crawledContent) {
            const newKey = await reextractKeyword(searchKeyword);
            if (newKey && newKey !== searchKeyword) {
              setLoadingMessage(`키워드를 보정했어요: '${newKey}'로 재검색 중... 🔎`);
              crawledContent = await fetchCrawledNewsContent(newKey);
            }
          }
        } catch (e) {
          console.warn(`크롤링 오류 (${attempt}/3):`, e?.message || e);
        }
        if (!crawledContent && attempt < 3) {
          await new Promise(r => setTimeout(r, 800));
        }
      }

      if (!crawledContent) {
        setNewsDetail(null);
        setLoading(false);
        return;
      }

      setLoadingMessage('AI가 기사를 읽고 요약하는 중... 🤖');
      const rawText = await fetchNewsDetails(crawledContent, keyword);

      if (rawText && typeof rawText === 'string') {
        try {
          const startIndex = rawText.indexOf('{');
          const endIndex = rawText.lastIndexOf('}');
          if (startIndex > -1 && endIndex > -1) {
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonString);
            setNewsDetail(parsed);
          } else {
            setNewsDetail(null);
          }
        } catch (e) {
          console.error('JSON 파싱 오류:', e);
          setNewsDetail(null);
        }
      } else {
        setNewsDetail(null);
      }

      setLoading(false);
    };

    getNewsDetails();
  }, [keyword]);

  useEffect(() => {
    if (!newsDetail) return;
    const bg = normalizeText(newsDetail.background_info);
    const sum = normalizeText(newsDetail.summary);
    setBackgroundDisplay(bg);
    setSummaryDisplay(sum);
  }, [newsDetail]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
        <ThemeText style={[styles.loadingText, { color: colors.subText }]}>{loadingMessage}</ThemeText>
      </SafeAreaView>
    );
  }

  if (!newsDetail) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemeText>뉴스 정보를 불러오지 못했습니다. 😢</ThemeText>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <ThemeText style={{ fontSize: 18, fontWeight: 'bold' }}>{'← 뒤로가기'}</ThemeText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const titleText = normalizeText(newsDetail.title);
  const summaryText = normalizeText(newsDetail.content_summarize);
  const backgroundText = normalizeText(backgroundDisplay);
  const aiSummaryText = normalizeText(summaryDisplay);

  const ContainerScroll = ThemeScrollView || ScrollView;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageTitleComponent title={titleText} />

      <ContainerScroll contentContainerStyle={styles.scrollView}>

        {/* 1. 기사 내용 요약 섹션 */}
        <ThemeView style={[styles.sectionContainer, { backgroundColor: colors.boxBackground, borderColor: isDark ? '#8C8C8C' : '#EAEAEA', borderWidth: 1 }]}>
          {/* ✅ Import한 TypingText 사용 (Props 주의: fullText, textColor) */}
          <TypingText
            fullText={summaryText}
            speed={10}
            textColor={colors.text}
          // 만약 TypingText가 style prop을 지원하지 않는다면, 
          // 폰트 크기 조절 등을 위해 ThemeText로 감싸거나 TypingText 코드를 수정해야 할 수도 있습니다.
          // 보통 챗봇용은 폰트가 고정되어 있을 수 있습니다.
          />
        </ThemeView>

        {/* 2. 배경 지식 섹션 */}
        <ThemeView style={[styles.sectionContainer, { backgroundColor: '#fffbea', borderColor: isDark ? '#8C8C8C' : '#EAEAEA', borderWidth: 1 }]}>
          <ThemeText style={[styles.sectionTitle, { color: colors.text }]}>📘 배경 지식</ThemeText>
          <TypingText
            fullText={backgroundText}
            speed={10}
            textColor={colors.text}
          />
        </ThemeView>

        {/* 3. AI 요약 섹션 */}
        <ThemeView style={[styles.sectionContainer, { backgroundColor: '#e8f5e9', borderColor: isDark ? '#8C8C8C' : '#EAEAEA', borderWidth: 1 }]}>
          <ThemeText style={[styles.sectionTitle, { color: colors.text }]}>📝 요즈미 AI 요약</ThemeText>
          <TypingText
            fullText={aiSummaryText}
            speed={10}
            textColor={colors.text}
          />
        </ThemeView>

      </ContainerScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16 },
  container: { flex: 1 },
  scrollView: { padding: 20, paddingBottom: 40 },
  sectionContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sectionContent: { fontSize: 15, lineHeight: 22 },
});