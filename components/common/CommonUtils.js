import axios from "axios";
import {BackHandler} from "react-native";
import {useKeyStore} from "../../stores/KeyStore";


export const CommonUtils = {
    googleSearch: async function (searchWord, dateRestrict) {
        const {GEMINI_API_KEY, GOOGLE_API_KEY, SEARCH_ENGINE_ID} = useKeyStore.getState();

        try {
            const url = `https://www.googleapis.com/customsearch/v1?q=${searchWord}&cx=${SEARCH_ENGINE_ID}&dateRestrict=${dateRestrict}&key=${GOOGLE_API_KEY}`;

            console.log("Google Search API 요청 URL:", url); // API 요청 URL을 출력하여 디버깅

            const response = await axios.get(url);
            const searchResults = response.data.items || [];

            // 검색 결과에서 제목 & 스니펫(설명) 기반으로 키워드 추출
            const keywords = searchResults.map(item => item.title + " " + item.snippet);

            return keywords;
        } catch (error) {
            console.error("Google Search API Error:", error);
            return [];
        }
    },
    fetchGeminiTrendKeywords: async function (keywords) {
        const {GEMINI_API_KEY} = useKeyStore.getState();

        try {
            const prompt = `
        최근 유행하는 밈과 챌린지에 대한 검색 결과를 분석하고, 밈이나 챌린지 키워드들을 정리해서 오늘 기준 한국에서 가장 핫한 키워드 5개만 나열해줘. 
        밈 챌린지 등 실제 밈이나 챌린지 내용이 아닌 단순 "밈 챌린지"와 같은 단어의 조합 같은 경우는 제외.

        ✅ 제공된 검색 데이터:
        ${keywords.join("\n")}

        🔥 분석 기준:
        - 검색 데이터에서 반복적으로 등장하는 키워드  
        - 현재 트렌드에 맞는 유행어 또는 밈  
        - 사람들이 SNS에서 많이 언급할 가능성이 높은 키워드  
        - 짧고 강렬한 단어 또는 표현

        🎯 결과 형식 (예시):
        1. 고독한 미식가
        2. 퀸 네버 크라이
        3. 헤어지자고? 너 누군데?
        4. 알잘딱깔센
        5. 칠가이

        📌 주의:
        - **기존 검색어를 그대로 나열하지 말고, 가장 핵심적인 5개만 정리**  
        - **순위는 인기와 트렌드에 따라 정렬**  
        - **유튜브, 틱톡, X(트위터) 등 SNS 사이트의 결과를 우선 반영**
        - **분석 결과, 현재 가장 트렌디한 ~ 과 같은 안내 멘트 일절 없이 5개의 키워드 만 반환**
        - **밈, 챌린지, 밈 챌린지, 유행 혹은 이들을 조합한 단어와 같은 직접적인 밈 내용이 아닌 것들로만 구성된 단어는 제외**
        - **리스트 형태로 반환**
        `;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            role: "user",
                            parts: [{text: prompt}]
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

            // Gemini 응답에서 정리된 키워드 추출
            return response.data.candidates[0].content.parts[0].text
                .split("\n")
                .map(item => item.replace(/^[-*0-9.]\s*/, "").trim()) // 리스트 포맷 제거
                .filter(item => item.length > 0)
                .slice(0, 5);
        } catch (error) {
            console.error("Gemini API Error:", error);
            return [];
        }
    },
    fetchGemini: async function (prompt) {
        // prompt = "너는 이제부터 Z세대 트렌드 전문가 캐릭터야. 말투는 친근하고 재치 있게, 약간 요즘 말투로 이야기해줘.\n\nQ: " + prompt;
        const {GEMINI_API_KEY} = useKeyStore.getState();

        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            role: "user",
                            parts: [{text: prompt}]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        // maxOutputTokens: 150
                    }
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
            return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (error) {
            console.error("Gemini API Error:", error);
            return [];
        }
    },
    fetchChatGPT: async function (prompt) {
        const {OPENAI_API_KEY} = useKeyStore.getState();
        const API_ENDPOINT = 'https://api.openai.com/v1/responses';

        if (!OPENAI_API_KEY) {
            console.error("OPENAI_API_KEY가 설정되지 않았습니다.");
            return;
        }

        // 1. 요청 본문(Body) 데이터 구성
        const requestBody = {
            model: "gpt-4o-mini", // 웹 검색 지원 모델
            input: prompt,

            // ⭐ 핵심: tools 배열에 web_search_preview 툴을 명시
            tools: [
                { type: "web_search_preview" }
            ],

            // (선택 사항) 기타 매개변수:
            // temperature: 0.7,
            // search_context_size: "high",
        };

        try {
            // 2. Axios를 사용하여 POST 요청 전송
            const response = await axios.post(
                API_ENDPOINT,
                requestBody,
                {
                    // 3. Headers 설정 (Authorization 필수)
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    }
                }
            );

            // 4. 응답 데이터 처리
            console.log("AI 응답:");
            console.log(response.data);
            console.log(response.data.output.length);

            let result = response.data
            result = result.output[result.output.length - 1].content[0];
            console.log(result);

            return result.text

        } catch (error) {
            console.error("API 호출 오류:", error.response ? error.response.data : error.message);
        }
    },
    noGoBack: function () {
        const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            return true; // ← true를 반환하면 뒤로가기 방지
        });

        return () => backHandler.remove(); // cleanup
    },
}