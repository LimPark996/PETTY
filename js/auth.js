import { supabase } from "./supabase.js";
// ✅ 로그인 버튼 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
  const githubBtn = document.querySelector("#login-github");
  const googleBtn = document.querySelector("#login-google");

  if (githubBtn) {
    githubBtn.addEventListener("click", () => signInWithProvider("github"));
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", () => signInWithProvider("google"));
  }

  // 로그인 완료 후 자동 로그인 감지
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("🔹 인증 상태 변경:", event, session);
    if (session) {
      window.location.href = "../html/index.html"; // 로그인 후 홈으로 이동
    }
  });
});

// ✅ 소셜 로그인 실행 함수
async function signInWithProvider(provider) {
  try {
    await supabase.auth.signOut(); // 기존 세션 제거
    const redirectUrl = window.location.origin + "/PETTY"; // 돌아올 위치

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        prompt: "select_account",
      },
    });

    if (error) {
      console.error(`🛑 ${provider} 로그인 오류:`, error.message);
      alert("로그인에 실패했습니다. 다시 시도해 주세요.");
    } else {
      console.log(`✅ ${provider} 로그인 요청 성공`);
    }
  } catch (err) {
    console.error("🛑 로그인 중 예외 발생:", err);
  }
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession();
  return error || !data?.session ? null : data.session.user.id;
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}
