// ✅ Supabase 인스턴스 가져오기
import { supabase } from "./supabase.js";

// ✅ 문서가 완전히 로드된 후 실행
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js 로드됨");

  // 네비게이션 바와 푸터를 불러옴
  await loadNavbar();
  await loadFooter();

  // ✅ 인증 상태 변경 감지 (로그인/로그아웃/세션 복구 등)
  supabase.auth.onAuthStateChange(() => {
    console.log("👀 index.html에서도 인증 상태 감지됨 (onAuthStateChange 실행)");
    checkLogin(); // 버튼 상태 다시 확인
  });
});

// ✅ 푸터를 외부 HTML에서 불러와 삽입
async function loadFooter() {
  const res = await fetch("templates/footer.html"); // HTML 요청
  const html = await res.text();                    // 텍스트 변환
  document.getElementById("footer").innerHTML = html; // 삽입
  console.log("✅ footer 로드 완료");
}

// ✅ 네비게이션 바를 외부 HTML에서 불러와 삽입
async function loadNavbar() {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) {
    console.error("🛑 #navbar 요소 없음");
    return;
  }

  try {
    const response = await fetch("asset/navbar.html"); // HTML 요청
    const html = await response.text();                // 텍스트로 변환
    navbarContainer.innerHTML = html;                  // 삽입
    console.log("✅ 네비게이션 바 로드 완료");

    // ✅ checkLogin 호출은 여기에 추가해도 좋아요 (초기 상태 렌더링)
    checkLogin();
  } catch (err) {
    console.error("🛑 navbar 로딩 실패:", err);
  }
}

// ✅ 로그인 상태를 확인하고 UI 업데이트
async function checkLogin() {
  console.log("🔍 checkLogin() 실행됨");

  const { data: sessionData, error } = await supabase.auth.getSession(); // 세션 가져오기
  console.log("📦 Supabase 세션 정보:", sessionData);

  const loginBtn = document.querySelector("#login-btn");   // 로그인 버튼
  const logoutBtn = document.querySelector("#logout-btn"); // 로그아웃 버튼
  const userInfo = document.querySelector("#user-info");   // 사용자 이름 표시 영역

  if (!loginBtn || !logoutBtn) {
    console.warn("⚠️ 로그인/로그아웃 버튼 요소를 찾을 수 없습니다.");
    return;
  }

  // ✅ 버튼에 중복 이벤트 방지용으로 복제 후 교체
  const freshLoginBtn = loginBtn.cloneNode(true);
  loginBtn.replaceWith(freshLoginBtn);
  const freshLogoutBtn = logoutBtn.cloneNode(true);
  logoutBtn.replaceWith(freshLogoutBtn);

  // ✅ 로그인되어 있지 않은 상태
  if (error || !sessionData?.session) {
    console.log("🚪 로그인 안 된 상태입니다.");

    freshLoginBtn.style.display = "inline-block"; // 로그인 버튼 표시
    freshLogoutBtn.style.display = "none";        // 로그아웃 버튼 숨김
    if (userInfo) userInfo.style.display = "none";

    // 로그인 버튼 클릭 시 로그인 페이지로 이동
    freshLoginBtn.addEventListener("click", () => {
      console.log("➡️ 로그인 페이지로 이동");
      window.location.href = "./login.html";
    });

  // ✅ 로그인 상태일 경우
  } else {
    const user = sessionData.session.user;
    const name = user.user_metadata?.full_name || user.email; // 이름 또는 이메일
    console.log(`🙋‍♀️ 로그인된 사용자: ${name}`);

    freshLoginBtn.style.display = "none"; // 로그인 버튼 숨김
    freshLogoutBtn.style.display = "inline-block"; // 로그아웃 버튼 표시

    if (userInfo) {
      userInfo.textContent = `👋 ${name}`;
      userInfo.style.display = "inline-block";
    }

    // 로그아웃 버튼 클릭 이벤트
    freshLogoutBtn.addEventListener("click", signOutAndReload);
  }
}

// ✅ 로그아웃 후 새로고침
async function signOutAndReload() {
  console.log("🔄 로그아웃 시도 중...");
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("🛑 로그아웃 실패:", error.message);
    alert("로그아웃 중 문제가 발생했어요.");
  } else {
    console.log("✅ 로그아웃 완료");
    window.location.reload(); // 페이지 새로고침
  }
}