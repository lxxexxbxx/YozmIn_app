import axios from 'axios';
import { DOMParser } from 'react-native-html-parser';
import { useKeyStore } from "../../../stores/KeyStore"; // Naver API 키를 위한 스토어

/**
 * 네이버 뉴스 검색 API를 호출하여 가장 정확한 기사 URL을 반환합니다.
 * @param {string} title - 검색할 기사 제목
 * @returns {Promise<string|null>} - 찾은 기사 URL 또는 null
 */
const findNewsUrlByTitle = async (title) => {
    const { NAVER_CLIENT_ID, NAVER_CLIENT } = useKeyStore.getState();

    try {
        const response = await axios.get(
            `https://openapi.naver.com/v1/search/news.json`, {
                params: {
                    query: `"${title}"`, // 정확한 제목 검색을 위해 따옴표 추가
                    display: 5,
                    sort: 'sim'
                },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT,
                },
            }
        );

        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log("🚨 네이버 검색 API에서 기사를 찾지 못했습니다.");
            return null;
        }

        // 네이버 뉴스 URL을 우선적으로 선택
        const naverNewsItems = items.filter(item => item.link.includes('n.news.naver.com') || item.link.includes('news.naver.com'));
        if (naverNewsItems.length > 0) {
            return naverNewsItems[0].link;
        }

        // 네이버 뉴스 URL이 없으면 첫 번째 결과라도 사용
        return items[0].link;

    } catch (error) {
        console.error("🚨 네이버 검색 API 호출 오류:", error);
        return null;
    }
};

/**
 * 주어진 URL의 HTML을 가져와 Cheerio로 파싱하고 기사 본문을 추출합니다.
 * @param {string} url - 크롤링할 기사 URL
 * @returns {Promise<string|null>} - 추출된 기사 본문 텍스트 또는 null
 */
const extractArticleContent = async (url) => {
    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // ⭐️ 2. DOMParser를 사용해 HTML 문자열을 파싱합니다.
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const contentIds = [
            'newsct_article',
            'dic_area',
            'articeBody',
            'newsEndContents'
        ];

        let contentNode;
        for (const id of contentIds) {
            // ⭐️ 3. getElementById로 ID를 가진 요소를 찾습니다.
            contentNode = doc.getElementById(id);
            if (contentNode) break;
        }

        if (contentNode) {
            // ⭐️ 4. textContent 속성으로 내부 텍스트를 추출합니다.
            const text = contentNode.textContent;
            return text.replace(/\s+/g, ' ').trim();
        } else {
            console.log("🚨 기사 본문을 찾을 수 있는 ID가 없습니다.");
            return null;
        }

    } catch (error) {
        console.error("🚨 기사 HTML을 가져오거나 파싱하는 중 오류 발생:", error);
        return null;
    }
};

/**
 * 뉴스 제목으로 검색, 크롤링, 본문 추출을 모두 수행하는 메인 함수
 * @param {string} title - 크롤링할 기사의 제목
 * @returns {Promise<string|null>} - 최종적으로 추출된 기사 본문
 */
export const fetchCrawledNewsContent = async (title) => {
    if (!title) {
        console.error("🚨 크롤링할 뉴스 제목이 없습니다.");
        return null;
    }

    console.log(`🔹 1. "${title}" 제목으로 뉴스 URL 검색 중...`);
    const newsUrl = await findNewsUrlByTitle(title);

    if (!newsUrl) {
        return null;
    }

    console.log(`🔹 2. 찾은 URL로 기사 내용 크롤링 중...: ${newsUrl}`);
    const content = await extractArticleContent(newsUrl);

    if (content) {
        console.log("✅ 기사 본문 크롤링 및 추출 성공!");
    }

    return content;
};