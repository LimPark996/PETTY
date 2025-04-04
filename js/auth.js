// ✅ Supabase 인스턴스 가져오기
import { supabase } from "./supabase.js";

// ✅ 페이지가 완전히 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {
  // 로그인 버튼 요소 가져오기
  const githubBtn = document.querySelector("#login-github"); // GitHub 로그인 버튼
  const googleBtn = document.querySelector("#login-google"); // Google 로그인 버튼

  // GitHub 로그인 버튼이 있으면 클릭 이벤트 등록
  if (githubBtn) {
    githubBtn.addEventListener("click", () => signInWithProvider("github"));
  }

  // Google 로그인 버튼이 있으면 클릭 이벤트 등록
  if (googleBtn) {
    googleBtn.addEventListener("click", () => signInWithProvider("google"));
  }

  // ✅ 로그인/로그아웃/세션 복구 등 인증 상태가 바뀔 때마다 실행됨
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("🔹 인증 상태 변경:", event, session);

    // 실제로 세션이 존재하는지 다시 확인 (리다이렉트 조건 체크용)
    const { data } = await supabase.auth.getSession();
    
    if (data?.session) {
      // 로그인 세션이 있다면 메인 페이지로 이동
      window.location.href = "./index.html";
    } else {
      // 세션이 아직 복구되지 않은 경우 대기
      console.warn("🕓 세션이 아직 복구되지 않았습니다. 리다이렉트 보류");
    }
  });
});


// ✅ 소셜 로그인 실행 함수 (GitHub 또는 Google)
async function signInWithProvider(provider) {
  try {
    // 이전 로그인 세션이 남아있다면 제거
    await supabase.auth.signOut(); 

    // 로그인 후 돌아올 페이지 (redirect URL)
    const redirectUrl = window.location.origin + "/PETTY/login.html";

    // Supabase 소셜 로그인 실행
    const { error } = await supabase.auth.signInWithOAuth({
      provider, // "github" 또는 "google"
      options: {
        redirectTo: redirectUrl,     // 로그인 후 리다이렉션할 URL
        prompt: "select_account",    // 계정 선택 창을 항상 보여줌
      },
    });

    // 오류 발생 시 알림
    if (error) {
      console.error(`🛑 ${provider} 로그인 오류:`, error.message);
      alert("로그인에 실패했습니다. 다시 시도해 주세요.");
    } else {
      console.log(`✅ ${provider} 로그인 요청 성공`);
    }
  } catch (err) {
    // 예외 처리
    console.error("🛑 로그인 중 예외 발생:", err);
  }
}


// ✅ 현재 로그인된 사용자의 ID를 가져오는 함수
export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession();

  // 에러가 있거나 세션이 없으면 null 반환, 있으면 user ID 반환
  return error || !data?.session ? null : data.session.user.id;
}

// ✅ 현재 세션의 Access Token을 가져오는 함수 (API 호출 등에 사용 가능)
export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();

  // 세션이 있으면 access_token 반환, 없으면 null 반환
  return data?.session?.access_token || null;
}
