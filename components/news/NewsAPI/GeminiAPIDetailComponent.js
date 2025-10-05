// GeminiAPIDetailComponent.js

import axios from "axios";
import { useKeyStore } from "../../../stores/KeyStore";


export const extractKeywordFromTitle = async (title) => {
    const GEMINI_API_KEY = useKeyStore.getState().GOOGLE_API_KEY;
    console.log(`🔹 Gemini API에 키워드 추출 요청: "${title}"`);

    if (!title) return null;

    try {
        const prompt = `
        다음 문장에서 가장 핵심적인 기사 검색용 키워드(1~3개 단어)를 추출해줘.
        , 사용해서 하지말고 두단어 또는 세단어로만 핵심적으로 추출해야해.
        다른 설명 없이 키워드만 응답해줘.
        

        문장: "${title}"
        
        예시:
        문장: "정부 전산망 마비 및 복구 노력"
        키워드: "전산망 마비"

        문장: "의대 정원 확대 및 의정 갈등 심화"
        키워드: "의대 정원 확대"
        
        잘못된 예시 :
        문장 : 대통령실 조직 개편 및 인선 변화
        키워드 : 조직 개편, 인선 변화
        올바른 키워드 : 대통령실 조직 개편
        `
        ;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 50,
                }
            },
            { headers: { "Content-Type": "application/json" } }
        );

        const keyword = response.data.candidates?.[0]?.content?.parts?.[0]?.text.trim() || null;
        console.log(`✅ 추출된 키워드: "${keyword}"`);
        return keyword;

    } catch (error) {
        console.error("🚨 Gemini API 키워드 추출 오류:", error);
        return title; // 실패 시 원본 제목을 그대로 반환
    }
};

// ⭐️ 함수 인자를 (crawledContent, title)로 변경
export const fetchNewsDetails = async (crawledContent, title) => {
    const GEMINI_API_KEY = useKeyStore.getState().GOOGLE_API_KEY;
    console.log("🔹 Gemini API에 크롤링된 뉴스 분석 및 요약 요청...");

    // 크롤링된 본문이 없으면 요청을 보내지 않음
    if (!crawledContent) {
        console.error("🚨 Gemini API에 전달할 기사 본문이 없습니다.");
        return null;
    }

    try {
        // ✅ 프롬프트 수정: 뉴스 주제 대신 '기사 본문'을 제공하고 요약 요청
        const prompt = `
        다음 뉴스 기사 본문을 분석해서 상세 정보를 JSON 형식으로 생성해줘.

        📌 **분석할 뉴스 제목**:
        "${title}"

        📌 **분석할 뉴스 기사 본문 (이 내용을 새로 너가 기사를 쓴다는 느낌으로 작성해줘)**:
        ---
        ${crawledContent.substring(0, 8000)} 
        ---
        
        🎯 **출력 규칙**:
        - 반드시 다음 JSON 형식에 맞춰서 출력해줘.
        - 각 필드에 대한 설명은 생략하고 JSON 데이터만 제공해줘.
        - 'content_summarize'는 위 기사 본문을 종합하여 최소 3문장 이상으로 상세하게 요약해줘.
        - 'background_info'는 기사를 이해하는 데 도움이 될 만한 배경 지식이나 관련 용어를 설명해줘.
        - 'summary'는 전체 내용을 한 문장으로 간결하게 요약해줘.

        \`\`\`json
        {
          "title": "${title}",
          "content_summarize": "여기에 상세한 내용 요약을 넣어줘 (3문장 이상)",
          "background_info": "여기에 배경 지식 설명을 넣어줘",
          "summary": "여기에 AI가 요약한 한 문장 요약을 넣어줘"
        }
        \`\`\`
        `;

        // ✅ Gemini API 호출
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        console.log("🔹 Gemini 응답 (Raw Text):", content);

        return content; // 파싱은 NewsDetailComponent에서 하므로 원본 텍스트를 반환

    } catch (error) {
        console.error("🚨 Gemini API 상세 정보 호출 오류:", error);
        return null;
    }
};