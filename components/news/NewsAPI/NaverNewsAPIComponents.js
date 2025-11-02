import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useKeyStore} from "../../../stores/KeyStore";

// 뉴스 데이터 유효 시간 (예: 1시간 = 3600000ms)
const EXPIRATION_TIME = 3600000;

export const fetchNewsTitles = async (query) => {
    const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = useKeyStore.getState();
    const searchQuery = Array.isArray(query) ? query.join[0] : query;
    // URL 요청 시 오류 발생할 수 있는 한글 띄어쓰기가 보함되어 있기 때문에 인코딩 쿼리 인코딩 필수
    const encodedQuery = encodeURIComponent(searchQuery);
    const DYNAMIC_STORAGE_KEY = `news_titles_${searchQuery}`

    try {
        // ✅ 1. 로컬 저장소에서 데이터 확인
        const storedData = await AsyncStorage.getItem(DYNAMIC_STORAGE_KEY);

        if (storedData) {
            const { newsTitles, timestamp } = JSON.parse(storedData);
            const currentTime = new Date().getTime();
            console.log('📂', DYNAMIC_STORAGE_KEY, '카테고리의 데이터 존재 확인')

            // ✅ 저장된 데이터가 유효하면 API 호출 없이 사용
            if (currentTime - timestamp < EXPIRATION_TIME) {
                console.log(`📂 저장된 [${searchQuery}] 뉴스 데이터 사용`);
                console.log('📰 뉴스 1000개 제목 (처음 20개만 출력):', newsTitles.slice(0, 20));
                return newsTitles;
            }
        }

        // ✅ 2. 뉴스 데이터가 없거나 만료되었으면 API 호출
        console.log(`🔹 네이버 뉴스 API 호출 중... (쿼리: ${searchQuery})`);
        let allNews = [];
        for (let start = 1; start <= 1000; start += 100) {
            const response = await axios.get(
                `https://openapi.naver.com/v1/search/news.json?query=${encodedQuery}&display=100&start=${start}&sort=date`,
                {
                    headers: {
                        'X-Naver-Client-Id': NAVER_CLIENT_ID,
                        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                    },
                }
            );
            const newsTitles = response.data.items.map(item => item.title.replace(/<[^>]*>?/gm, '')); // HTML 태그 제거
            allNews = [...allNews, ...newsTitles];
        }

        // ✅ 3. 새로운 뉴스 데이터를 AsyncStorage에 저장
        const dataToStore = {
            newsTitles: allNews,
            timestamp: new Date().getTime(), // 저장한 시간 기록
        };
        await AsyncStorage.setItem(DYNAMIC_STORAGE_KEY, JSON.stringify(dataToStore));

        console.log('✅ 새 뉴스 데이터를 저장하고 반환');
        console.log('📰 가져온 뉴스 1000개 제목 (처음 10개만 출력):', allNews.slice(0, 10)); // 🔥 첫 10개 뉴스 제목 로그 출력
        return allNews;

    } catch (error) {
        console.error('🚨 뉴스 API 호출 오류:', error);
        return [];
    }
};

export const fetchNewsDetail = async (title) => {
    const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = useKeyStore.getState();

    try {
        console.log(`🔎 뉴스 검색: ${title}`);

        const response = await axios.get(
            `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(title)}&display=1&sort=date`,
            {
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                },
            }
        );

        if (response.data.items.length > 0) {
            const newsItem = response.data.items[0]; // 관련도가 가장 높은 뉴스 1개 가져오기
            return {
                title: newsItem.title.replace(/<[^>]*>?/gm, ''), // HTML 태그 제거
                description: newsItem.description.replace(/<[^>]*>?/gm, ''), // HTML 태그 제거
                link: newsItem.link,
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("🚨 네이버 뉴스 API 호출 중 오류 발생:", error);
        return null;
    }
};