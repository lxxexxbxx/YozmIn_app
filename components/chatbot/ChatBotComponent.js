import React, { useEffect, useRef, useState } from "react";
import {
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Dimensions,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import TypingText from "./TypingText";
import { useUserStore } from "../../stores/UserStore";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import supabase from "../../supabase";
import {useKeyStore} from "../../stores/KeyStore";

// ==========================================
// [설정] GEMMA 3 서버리스 엔드포인트 (Hugging Face Inference Endpoint)
// ==========================================
const API_URL =
  "https://qwby9heo12ouhnej.us-east-1.aws.endpoints.huggingface.cloud";

const { height } = Dimensions.get("window");

// ⚠️ 실서비스면 토큰은 앱에 박지 말고(유출됨) 서버/엣지펑션으로 빼세요.
const {HF_TOKEN} = useKeyStore.getState();

// ==========================================
// [주의] 아래 테이블명은 프로젝트에 맞게 수정하세요.
// - RPC match_meme_documents가 내부적으로 쓰는 테이블명과 다를 수 있음
// ==========================================
const MEME_TABLE = "trend_memes";

// HF Router 기반 임베딩 모델
const EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2";
const EMBED_API = `https://router.huggingface.co/hf-inference/models/${EMBED_MODEL}/pipeline/feature-extraction`;

const ChatBotComponent = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  const userStore = useUserStore();
  const { colors, isDark } = useTheme();

  const getTime = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  // ===========================
  // 0) 유틸: 텍스트 정리
  // ===========================
  const norm = (s) => (s ?? "").toString().trim();

  // ===========================
  // 1) 날짜/시기 파싱 (확정 파싱 우선)
  // - "2025년 10월" -> {year: 2025, month: 10}
  // - "작년 크리스마스" -> {year: now-1, month: 12, periodKeyword:"크리스마스"}
  // - "올해" -> {year: now, month:null}
  // ===========================
  const extractYearMonthExtended = (text) => {
    const t = norm(text);
    const now = new Date();
    const nowYear = now.getFullYear();

    // 1) 명시: "YYYY년 M월"
    const m1 = t.match(/(19\d{2}|20\d{2})\s*년\s*(\d{1,2})\s*월/);
    if (m1) {
      return { year: Number(m1[1]), month: Number(m1[2]), periodKeyword: null };
    }

    // 2) 상대표현 year
    let year = null;
    if (t.includes("올해")) year = nowYear;
    else if (t.includes("작년") || t.includes("지난해")) year = nowYear - 1;
    else if (t.includes("내년")) year = nowYear + 1;

    // 3) 명시: "M월"
    const m2 = t.match(/(\d{1,2})\s*월/);
    const month = m2 ? Number(m2[1]) : null;

    // 4) 특정 시즌/기념일 → month 힌트
    // (필요하면 더 추가하세요)
    const holidayMap = [
      { key: "크리스마스", month: 12 },
      { key: "할로윈", month: 10 },
      { key: "새해", month: 1 },
      { key: "연말", month: 12 },
      { key: "설날", month: 2 }, // 매년 바뀌지만 대충 1~2월. 여기선 2월로 둠
      { key: "추석", month: 9 }, // 매년 바뀌지만 대충 9~10월. 여기선 9월로 둠
    ];

    let periodKeyword = null;
    let derivedMonth = month;

    for (const h of holidayMap) {
      if (t.includes(h.key)) {
        periodKeyword = h.key;
        if (derivedMonth == null) derivedMonth = h.month;
        break;
      }
    }

    return { year, month: derivedMonth, periodKeyword };
  };

  // ===========================
  // 2) 쿼리 라우팅(핵심)
  // - RAG 필요/불필요
  // - 어떤 검색 전략인지 결정
  // ===========================
  const classifyQuery = (text) => {
    const t = norm(text);
    const ym = extractYearMonthExtended(t);

    const hasMemeIntent = /(밈|유행|트렌드|짤|드립|유머|챌린지)/.test(t);
    const asksList = /(찾아줘|알려줘|추천|정리|모아|다\s*찾아|목록|리스트)/.test(t);
    const asksExplain = /(뭐야|뜻|설명|유래|어원|기원|출처|원본)/.test(t);

    const hasSimilarity = /(비슷|유사|같은\s*느낌|비슷한\s*느낌|비슷한\s*밈)/.test(t);
    const hasChrono = /(월별|시간순|연간|한\s*해|한해|년도\s*전체|정리해줘|요약해줘)/.test(t);

    // 개발/잡담/번역/첨삭류 → RAG 불필요
    const nonRagIntent =
      /(코드|에러|버그|수정|리액트|expo|supabase|sql|db|함수|api|배포|빌드|첨삭|번역)/i.test(t) ||
      /(안녕|하이|반가|고마워|ㅎㅎ|ㅋㅋ|ㅇㅇ|응|그래|굿)/.test(t);

    if (nonRagIntent) {
      return { route: "DIRECT_ONLY", ym, extractedTitle: null, keyword: null };
    }

    // 2-1) 시간순 요약/정리: "2024년 한 해 동안 월별로 요약"
    if (hasChrono && (ym.year != null || /(19\d{2}|20\d{2})/.test(t))) {
      const yearMatch = t.match(/(19\d{2}|20\d{2})\s*년/);
      const y = yearMatch ? Number(yearMatch[1]) : ym.year;
      return { route: "RAG_CHRONO", ym: { ...ym, year: y }, extractedTitle: null, keyword: null };
    }

    // 2-2) 유사 밈 추천: "'중꺾마'랑 비슷한"
    if (hasSimilarity) {
      const quoted = t.match(/['"“”](.+?)['"“”]/);
      const titleGuess = quoted ? quoted[1] : null;
      return { route: "RAG_SIMILARITY", ym, extractedTitle: titleGuess, keyword: null };
    }

    // 2-3) 특정 시기 + 키워드: "작년 크리스마스 때 유행했던 밈"
    // - ym.year/month가 있고, 밈 의도 + 추가 키워드(크리스마스 등)가 있으면 하이브리드로
    if ((ym.year != null || ym.month != null || ym.periodKeyword) && hasMemeIntent && asksList) {
      const keyword = ym.periodKeyword; // 기본은 시즌 키워드
      return { route: "RAG_PERIOD_KEYWORD", ym, extractedTitle: null, keyword };
    }

    // 2-4) 특정 시기: "2024년 10월 유행한 밈"
    if ((ym.year != null || ym.month != null) && hasMemeIntent) {
      return { route: "RAG_PERIOD", ym, extractedTitle: null, keyword: null };
    }

    // 2-5) Title 질문: "럭키비키가 뭐야?"
    // - (밈/유행 의도거나) "뭐야/뜻/설명"이고 길이가 짧으면 title lookup + RAG
    if ((asksExplain && t.length <= 30) || (hasMemeIntent && asksExplain && t.length <= 40)) {
      // title 후보: "~~가 뭐야" 앞부분
      const titleCandidate = t
        .replace(/\s+/g, " ")
        .replace(/(은|는|이|가)\s*(뭐야|뭐임|무슨\s*뜻|뜻이\s*뭐야|설명해줘).*/g, "")
        .trim();
      return {
        route: "RAG_TITLE",
        ym,
        extractedTitle: titleCandidate || null,
        keyword: null,
      };
    }

    // 2-6) 모호한 설명 기반: "긍정적으로 생각하라는 뜻의 밈"
    if (hasMemeIntent && (asksExplain || asksList)) {
      return { route: "RAG_SEMANTIC", ym, extractedTitle: null, keyword: null };
    }

    // 나머지는 모델이 그냥 대답
    return { route: "DIRECT_ONLY", ym, extractedTitle: null, keyword: null };
  };

  // ===========================
  // 3) LLM 호출
  // ===========================
  const fetchCustomLLM = async (text, currentMessages = []) => {
    const payload = {
      inputs: text,
      history: currentMessages
        .slice(-10) // 너무 길어지면 비용/지연 ↑
        .map((msg) => ({
          role: msg.role === "llm" ? "assistant" : "user",
          content: msg.text,
        })),
    };

    console.log("서버로 보내는 데이터:", JSON.stringify(payload, null, 2));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      console.error("401 Unauthorized: 토큰이 잘못되었거나 권한이 없습니다.");
      return "인증 에러가 발생했어. 토큰을 확인해줘! 🔑";
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`서버 에러 (${response.status}):`, errorText);
      throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "응답을 처리하지 못했어.. 😭";
  };

  // ===========================
  // 4) 임베딩 추출
  // ===========================
  const getVector = async (text, retryCount = 0) => {
    try {
      console.log(`🔹 임베딩 추출 시도 중... (${EMBED_MODEL})`);

      const response = await fetch(EMBED_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      });

      if (!response.ok) {
        if (response.status === 503 && retryCount < 3) {
          console.log("⚠️ 모델 로딩 중... 5초 후 재시도합니다.");
          await new Promise((res) => setTimeout(res, 5000));
          return getVector(text, retryCount + 1);
        }
        const errorMsg = await response.text();
        throw new Error(`API Error ${response.status}: ${errorMsg}`);
      }

      const result = await response.json();
      const embedding = Array.isArray(result?.[0]) ? result[0] : result;

      console.log("✅ 임베딩 추출 성공! 차원:", embedding.length);
      return embedding;
    } catch (error) {
      console.error("🚨 getVector 최종 실패:", error);
      throw error;
    }
  };

  // ===========================
  // 5) RAG 검색 함수들
  // ===========================
  const isRagContextUseful = (docs) => {
    if (!docs || docs.length === 0) return false;
    const top = docs[0]?.similarity ?? 0;
    // 너 로그 기준 0.6~0.8 나오니 최소컷만
    return docs.length >= 2 || top >= 0.65;
  };

  // (A) 벡터 + (year/month) 필터 RPC
  const retrieveByVectorRPC = async ({
    queryText,
    year,
    month,
    matchThreshold = 0.01,
    matchCount = 10,
  }) => {
    const queryVector = await getVector(queryText);

    const { data, error } = await supabase.rpc("match_meme_documents", {
      query_embedding: queryVector,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_year: year != null ? String(year) : null,
      filter_month: month != null ? String(month) : null,
    });

    if (error) throw error;
    return data ?? [];
  };

  // (B) Title 기반 간단 조회(테이블 직접 조회)
  // - table name 다르면 MEME_TABLE 바꾸세요.
  const retrieveByTitle = async (titleLike) => {
    const q = norm(titleLike);
    if (!q) return [];

    const { data, error } = await supabase
      .from(MEME_TABLE)
      .select("id,title,desc,year,month")
      .ilike("title", `%${q}%`)
      .limit(10);

    if (error) throw error;
    return data ?? [];
  };

  // (C) 연간(월별) 요약용: year 전체 가져오기
  const retrieveByYearAll = async (year) => {
    const y = year != null ? String(year) : null;
    if (!y) return [];

    // 데이터가 많으면 pagination 필요할 수 있음
    const { data, error } = await supabase
      .from(MEME_TABLE)
      .select("id,title,desc,year,month")
      .eq("year", y)
      .order("month", { ascending: true })
      .limit(500);

    if (error) throw error;
    return data ?? [];
  };

  // (D) 유사 밈 추천: 기준 밈을 title로 찾고 → 그 title로 벡터검색 → 자기 자신 제외
  const retrieveSimilarMemes = async (seedTitle) => {
    const seed = norm(seedTitle);
    if (!seed) return [];

    const seedDocs = await retrieveByTitle(seed);
    const seedDoc = seedDocs?.[0];
    const queryText = seedDoc?.title || seed;

    const docs = await retrieveByVectorRPC({
      queryText,
      year: null,
      month: null,
      matchThreshold: 0.01,
      matchCount: 10,
    });

    // 자기 자신(제목 같거나 id 같으면) 제외
    const filtered = docs.filter((d) => {
      if (seedDoc?.id != null && d.id === seedDoc.id) return false;
      if (seedDoc?.title && d.title === seedDoc.title) return false;
      return true;
    });

    return filtered;
  };

  // ===========================
  // 6) handleSend: 라우팅 + RAG 선택
  // ===========================
  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = norm(input);

    setMessages((prev) => [...prev, { role: "user", text: userText, time: getTime() }]);
    setInput("");

    try {
      const routeInfo = classifyQuery(userText);
      console.log("🧭 라우팅:", routeInfo);

      let useRag = false;
      let ragDocs = [];
      let ragModeLabel = "";
      let context = "";

      // ---------- 라우트별 RAG ----------
      if (routeInfo.route === "RAG_TITLE") {
        useRag = true;
        ragModeLabel = "TITLE_LOOKUP";

        // title lookup 우선
        const titleQuery = routeInfo.extractedTitle || userText;
        const titleDocs = await retrieveByTitle(titleQuery);

        // titleDocs가 비면 semantic fallback
        if (titleDocs.length > 0) {
          ragDocs = titleDocs.map((d) => ({ ...d, similarity: 1.0 }));
        } else {
          const docs = await retrieveByVectorRPC({
            queryText: userText,
            year: null,
            month: null,
            matchThreshold: 0.01,
            matchCount: 8,
          });
          ragDocs = docs;
        }
      } else if (routeInfo.route === "RAG_PERIOD") {
        useRag = true;
        ragModeLabel = "PERIOD";

        const docs = await retrieveByVectorRPC({
          queryText: userText,
          year: routeInfo.ym.year,
          month: routeInfo.ym.month,
          matchThreshold: 0.01,
          matchCount: 8,
        });
        ragDocs = docs;
      } else if (routeInfo.route === "RAG_PERIOD_KEYWORD") {
        useRag = true;
        ragModeLabel = "PERIOD_KEYWORD";

        // 하이브리드 느낌: queryText에 키워드도 섞고,
        // 결과에서 title/desc에 키워드가 포함된 것 우선.
        const keyword = routeInfo.keyword ? ` ${routeInfo.keyword}` : "";
        const docs = await retrieveByVectorRPC({
          queryText: `${userText}${keyword}`,
          year: routeInfo.ym.year,
          month: routeInfo.ym.month,
          matchThreshold: 0.01,
          matchCount: 12,
        });

        if (routeInfo.keyword) {
          const k = routeInfo.keyword;
          const withK = docs.filter(
            (d) => (d.title ?? "").includes(k) || (d.desc ?? "").includes(k)
          );
          ragDocs = withK.length > 0 ? withK : docs;
        } else {
          ragDocs = docs;
        }
      } else if (routeInfo.route === "RAG_SEMANTIC") {
        useRag = true;
        ragModeLabel = "SEMANTIC";

        const docs = await retrieveByVectorRPC({
          queryText: userText,
          year: null,
          month: null,
          matchThreshold: 0.01,
          matchCount: 10,
        });
        ragDocs = docs;
      } else if (routeInfo.route === "RAG_SIMILARITY") {
        useRag = true;
        ragModeLabel = "SIMILARITY";

        const seedTitle = routeInfo.extractedTitle || userText;
        const docs = await retrieveSimilarMemes(seedTitle);
        ragDocs = docs;
      } else if (routeInfo.route === "RAG_CHRONO") {
        useRag = true;
        ragModeLabel = "CHRONO";

        const docs = await retrieveByYearAll(routeInfo.ym.year);
        ragDocs = docs;
      } else {
        useRag = false;
      }

      // ---------- RAG 결과 품질이 약하면 RAG 끄기 ----------
      // (연간요약은 similarity가 없으니 예외 처리)
      if (useRag && ragModeLabel !== "CHRONO") {
        if (!isRagContextUseful(ragDocs)) {
          console.log("🟡 RAG 결과가 약해서 DIRECT로 전환");
          useRag = false;
          ragDocs = [];
          ragModeLabel = "";
        }
      }

      // ---------- 컨텍스트 구성 ----------
      if (useRag) {
        if (ragModeLabel === "CHRONO") {
          // 연간 요약: 월별로 그룹핑해서 LLM이 정리하기 좋게 전달
          const groups = {};
          for (const d of ragDocs) {
            const m = d.month ?? "unknown";
            if (!groups[m]) groups[m] = [];
            groups[m].push(d);
          }
          const monthKeys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));
          context = monthKeys
            .map((m) => {
              const items = groups[m]
                .map((x) => `- ${x.title}${x.desc ? `: ${x.desc}` : ""}`)
                .join("\n");
              return `## ${m}월\n${items}`;
            })
            .join("\n\n");
        } else {
          context =
            ragDocs.length > 0
              ? ragDocs
                .map(
                  (m) =>
                    `[${m.year ?? ""}/${m.month ?? ""}] ${m.title ?? ""}: ${m.desc ?? ""
                    } (sim=${m.similarity != null ? m.similarity.toFixed(3) : "na"})`
                )
                .join("\n")
              : "제공된 데이터에 관련 정보가 없음";
        }
      }

      // ---------- 최종 프롬프트 ----------
      // 공통 말투: 반말 + 정중
      const baseSystem = `너는 대한민국 밈 전문가/대화형 도우미야.
말투는 친근하게 반말로 하되 정중함을 유지해.
사용자가 특정 연/월/밈 목록/출처/설명을 요구하지 않으면, DB를 찾는 척하지 말고 일반 지식과 대화로 답해.`;

      let finalPrompt = "";

      if (!useRag) {
        finalPrompt = `${baseSystem}

[사용자 질문]
${userText}

[답변 가이드]
- 데이터가 없다고 말하지 말고, 일반적으로 알려진 정보/대화로 답해.
- 모르는 건 모른다고 하고, 사용자가 더 구체적으로 말하면 더 정확히 도와줄 수 있다고 안내해.
`;
      } else {
        // 라우트별로 약간씩 지시를 다르게
        if (ragModeLabel === "TITLE_LOOKUP") {
          finalPrompt = `${baseSystem}

[데이터]
${context}

[사용자 질문]
${userText}

[답변 가이드]
- 데이터에 해당 밈이 있으면 그 내용을 최우선으로 설명해.
- 정의(무슨 뜻), 사용 맥락(어떤 상황에서 쓰는지), 예시 문장 1~2개를 포함해.
`;
        } else if (ragModeLabel === "PERIOD" || ragModeLabel === "PERIOD_KEYWORD") {
          finalPrompt = `${baseSystem}

[데이터]
${context}

[사용자 질문]
${userText}

[답변 가이드]
- 해당 시기에 유행했던 밈을 3~5개 정도로 정리해.
- 각 밈마다 "한 줄 설명 + 어디서/어떤 맥락" 정도를 붙여.
- 데이터에 없으면, '데이터 기준으로는 명확히 찾기 어렵다'고만 말하고 추측으로 만들지 마.
`;
        } else if (ragModeLabel === "SEMANTIC") {
          finalPrompt = `${baseSystem}

[데이터]
${context}

[사용자 질문]
${userText}

[답변 가이드]
- 사용자가 기억 못하는 제목을 대신 찾아주는 느낌으로,
  데이터에서 의미적으로 가장 가까운 밈을 2~4개 제시해.
- 왜 그 밈을 골랐는지(설명/키워드 근거)도 짧게 덧붙여.
`;
        } else if (ragModeLabel === "SIMILARITY") {
          finalPrompt = `${baseSystem}

[데이터]
${context}

[사용자 질문]
${userText}

[답변 가이드]
- "비슷한 느낌" 기준으로 3~5개 추천해.
- 각각 어떤 점이 비슷한지(톤, 상황, 감정, 표현 방식)를 한 줄로 붙여.
`;
        } else if (ragModeLabel === "CHRONO") {
          const y = routeInfo.ym.year;
          finalPrompt = `${baseSystem}

[데이터 - ${y}년 월별]
${context}

[사용자 질문]
${userText}

[답변 가이드]
- ${y}년을 월별로 요약해. (월이 비어있으면 그 달은 생략)
- 각 월마다 1~3개 핵심 밈만 뽑아서 '한 줄 요약'으로 정리해.
- 마지막에 ${y}년 전체 흐름을 2~3줄로 총평해.
`;
        } else {
          // fallback
          finalPrompt = `${baseSystem}

[데이터]
${context}

[사용자 질문]
${userText}

[답변 가이드]
- 데이터 기반으로만 답하고, 없는 건 추측하지 마.
`;
        }
      }

      const llmAnswer = await fetchCustomLLM(finalPrompt, messages);
      setMessages((prev) => [...prev, { role: "llm", text: llmAnswer, time: getTime() }]);
    } catch (e) {
      console.error("최종 에러 상세:", e);
      const errorMsg =
        "지금 밈 백과사전 서버가 잠시 점검 중인 것 같아. 조금만 있다가 다시 물어봐줄래? 😭";
      setMessages((prev) => [...prev, { role: "llm", text: errorMsg, time: getTime() }]);
    }
  };

  const renderMessage = (msg, idx) => {
    const isLLM = msg.role === "llm";
    const isLast = idx === messages.length - 1 && isLLM;

    const bubbleColor = isLLM
      ? isDark
        ? "#4C4C4C"
        : "#EAEAEA"
      : isDark
        ? "#333333"
        : "#DCF8C6";

    return (
      <View
        key={idx}
        style={[
          styles.bubbleContainer,
          {
            alignSelf: isLLM ? "flex-start" : "flex-end",
            backgroundColor: bubbleColor,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isDark ? "#999" : "#DDD",
          },
        ]}
      >
        {isLast ? (
          <TypingText fullText={msg.text} speed={25} textColor={colors.text} />
        ) : (
          <ThemeText style={[styles.messageText, { color: colors.text }]}>
            {msg.text}
          </ThemeText>
        )}

        <ThemeText style={[styles.timeText, { color: colors.subText }]}>
          {msg.time}
        </ThemeText>
      </View>
    );
  };

  const init = async () => {
    if (userStore.name) {
      const prompt = `
사용자명: ${userStore.name}
오프닝 멘트를 한 줄로 해줘. 말은 반말이지만 정중하게. 예: "이재혁씨 반가워, 오늘은 뭐 알려줄까?"
그리고 현재 연도를 미상으로 생각해. 미래 과거 구분을 짓지마.
      `;
      try {
        const response = await fetchCustomLLM(prompt);
        const botMessage = { role: "llm", text: response, time: getTime() };
        setMessages((prev) => [...prev, botMessage]);
      } catch (e) {
        console.log("Init msg fetch failed");
      }
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <ThemeView
      style={[
        styles.inner,
        { backgroundColor: isDark ? "#121212" : "#FFFFFF" },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        style={[
          styles.chatContainer,
          { backgroundColor: isDark ? "#121212" : "#FFFFFF" },
        ]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <KeyboardAvoidingView
        style={styles.Container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ThemeView
          style={[
            styles.commentInputContainer,
            { backgroundColor: colors.boxBackground, borderColor: colors.border },
          ]}
        >
          <TextInput
            placeholder="질문을 입력하세요"
            placeholderTextColor={colors.subText}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? "#1E1E1E" : "#F0F0F0",
              },
            ]}
            value={input}
            onChangeText={setInput}
            multiline
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!input}
            style={styles.sendButton}
          >
            <Ionicons name="send" size={28} color={!input ? "#666" : "#4A90E2"} />
          </TouchableOpacity>
        </ThemeView>
      </KeyboardAvoidingView>
    </ThemeView>
  );
};

export default ChatBotComponent;

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  chatContainer: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 16,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
  },
  bubbleContainer: {
    maxWidth: "75%",
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  Container: {
    width: "100%",
  },
});
