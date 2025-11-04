import supabase from "../../supabase";

/**
 * 퀘스트 진행도 1 증가 함수
 * @param {number} questNo - 퀘스트 번호 (1~9)
 * @param {string} userId - 유저 ID (DB user_id, 예: "admin01")
 */
export async function pushQuest(questNo, userId) {
  if (!userId || !questNo) {
    console.warn(`[pushQuest] 잘못된 파라미터: questNo=${questNo}, userId=${userId}`);
    return;
  }

  try {
    // Supabase RPC 호출
    const { error } = await supabase.rpc("update_quest_progress", {
      p_quest_no: Number(questNo), // 숫자로 강제 변환
      p_user_id: userId,           // DB user_id (auth.uid() 아님)
    });

    if (error) {
      console.error(`❌ pushQuest RPC 오류: questNo=${questNo}, user=${userId}`, error.message);
    } else {
      console.log(`✅ pushQuest 성공: questNo=${questNo}, user=${userId}`);
    }
  } catch (e) {
    console.error(`🚨 pushQuest 예외 발생: questNo=${questNo}, user=${userId}`, e.message);
  }
}

/*
 * 오늘의 퀘스트 완료 자동 체크
 * (보너스 퀘스트 9번용)
 */
export async function checkBonusQuest(userId) {
  try {
    if (!userId) return;
    await supabase.rpc("update_quest_progress", {
      p_quest_no: 9,
      p_user_id: userId,
    });
    console.log(`🎁 보너스 퀘스트 9번 체크 완료 (${userId})`);
  } catch (e) {
    console.error("보너스 퀘스트 9번 체크 실패:", e.message);
  }
}
