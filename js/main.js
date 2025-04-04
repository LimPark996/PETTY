// ✅ Supabase 인스턴스 가져오기
import { supabase } from "./supabase.js";

// ✅ 문서가 완전히 로드된 후 실행
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js 로드됨");

  // 푸터와 네비게이션 바를 동적으로 불러오기
  await loadNavbar();
  await loadFooter();
});

// ✅ 푸터를 외부 HTML 파일에서 불러와서 삽입
async function loadFooter() {
  const res = await fetch("templates/footer.html"); // footer.html 가져오기
  const html = await res.text(); // HTML 텍스트로 변환
  document.getElementById("footer").innerHTML = html; // #footer에 삽입
}

// ✅ 네비게이션 바를 외부 HTML에서 불러와 삽입
async function loadNavbar() {
  const navbarContainer = document.getElementById("navbar"); // 네비게이션 영역 찾기
  if (!navbarContainer) {
    console.error("🛑 #navbar 요소 없음");
    return;
  }

  try {
    const response = await fetch("asset/navbar.html"); // navbar.html 가져오기
    const html = await response.text(); // 텍스트로 변환
    navbarContainer.innerHTML = html; // 삽입
    console.log("✅ 네비게이션 바 로드 완료");

    // 삽입 후, 로그인 상태를 확인해서 버튼 보이기 설정
    await checkLogin();
  } catch (err) {
    console.error("🛑 navbar 로딩 실패:", err);
  }
}

// ✅ 로그인 상태를 확인하고, 로그인/로그아웃 버튼 UI 및 이벤트 설정
async function checkLogin() {
  const { data: sessionData, error } = await supabase.auth.getSession(); // 로그인 세션 가져오기
  console.log('sessionData',sessionData);
  const loginBtn = document.querySelector("#login-btn"); // 로그인 버튼
  const logoutBtn = document.querySelector("#logout-btn"); // 로그아웃 버튼
  const userInfo = document.querySelector("#user-info"); // 사용자 정보 표시 영역

  if (!loginBtn || !logoutBtn) {
    console.warn("⚠️ 로그인/로그아웃 버튼 없음");
    return;
  }

  // ✅ 버튼에 중복 이벤트 연결 방지 위해 새로 복제하여 교체
  const freshLoginBtn = loginBtn.cloneNode(true);
  loginBtn.replaceWith(freshLoginBtn);
  const freshLogoutBtn = logoutBtn.cloneNode(true);
  logoutBtn.replaceWith(freshLogoutBtn);

  // ✅ 로그인 상태가 아니거나 오류가 발생한 경우
  if (error || !sessionData?.session) {
    freshLoginBtn.style.display = "inline-block"; // 로그인 버튼 표시
    freshLogoutBtn.style.display = "none";        // 로그아웃 버튼 숨김
    if (userInfo) userInfo.style.display = "none"; // 사용자 이름 숨김

    // 로그인 버튼 클릭 시 로그인 페이지로 이동
    freshLoginBtn.addEventListener("click", () => {
      console.log("➡️ 로그인 페이지로 이동");
      window.location.href = "./login.html";
    });

  // ✅ 로그인 상태일 경우
  } else {
    const user = sessionData.session.user;
    const name = user.user_metadata?.full_name || user.email; // 사용자 이름 또는 이메일

    freshLoginBtn.style.display = "none"; // 로그인 버튼 숨김
    freshLogoutBtn.style.display = "inline-block"; // 로그아웃 버튼 표시

    if (userInfo) {
      userInfo.textContent = `👋 ${name}`; // 사용자 이름 표시
      userInfo.style.display = "inline-block";
    }

    // 로그아웃 버튼 클릭 시 로그아웃 처리
    freshLogoutBtn.addEventListener("click", signOutAndReload);
  }
}

// ✅ 로그아웃 수행 후 새로고침
async function signOutAndReload() {
  const { error } = await supabase.auth.signOut(); // 로그아웃 수행
  if (error) {
    console.error("🛑 로그아웃 실패:", error.message);
    alert("로그아웃 중 문제가 발생했어요.");
  } else {
    console.log("✅ 로그아웃 완료");
    window.location.reload(); // 새로고침으로 상태 초기화
  }
}
