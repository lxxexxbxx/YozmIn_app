import axios from "axios";
import {useKeyStore} from "../../../stores/KeyStore";

export const fetchNewsTrends = async (newsTitles) => {
    const GEMINI_API_KEY = useKeyStore.getState().GOOGLE_API_KEY;
    try {
        console.log("🔹 Gemini 2.0 API에 뉴스 데이터 분석 요청 중...");

        // ✅ 프롬프트 설정 (뉴스 제목을 분석하여 TOP 10 트렌드 추출)
        const prompt = `다음 뉴스 제목을 분석하여 가장 중요한 5가지 트렌드를 추출해줘. 
        뉴스 제목은 1000개 정도 주어질 거야

        🎯 **출력 규칙**:
        - **"1. 주제" 형식으로만 출력** (설명 없이 제목만 작성)
        - **중요도 순서대로 1~5번까지 나열**
        - **불필요한 문장 없이 오직 5개 항목만 작성**
        - **1번~5번 제외 절대로 작성하지 않기**
        - **특정인물의 이름이 많은 경우 최빈값을 통해 제목에 포함**
        - **연예 관련 기사는 특정 이름을 포함해줘**
        
        ex. :
        1. 윤석열 대통령 구속 취소 및 정치적 파장
        2. 의대 정원 확대 및 의정 갈등 심화
        3. 홈플러스 관련 금융 지원 및 경영 위기
        4. 한화에어로스페이스 관련 주가 및 사업 동향
        5. 넷마블 신작 게임 출시 및 IP 확장 경쟁

        
        📌 **뉴스 제목 목록**:
        ${newsTitles.join("\n")}
        
        🔍 위 뉴스 제목을 분석하여 가장 중요한 5가지 트렌드를 위의 출력 규칙대로 제공해줘.`;

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
                    maxOutputTokens: 300
                }
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        // ✅ 응답 데이터에서 주제 목록 추출
        const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("🔹 Gemini 응답 (텍스트):", content);

        const topics = content
            .split("\n")
            .map(topic => topic.replace(/^\d+\.\s*/, "").trim()) // 숫자와 공백 제거
            .filter(topic => topic.length > 0); // 빈 항목 제거

        console.log("🔹 파싱된 뉴스 주제 목록:", topics);

        return topics;
    } catch (error) {
        console.error("🚨 Gemini API 호출 오류:", error);
        return [];
    }
};