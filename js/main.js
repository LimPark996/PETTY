import { supabase } from "./js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js 로드됨");
  await loadNavbar();
  checkLogin(); // 페이지 진입 시 로그인 상태 확인
});

// 📌 네비게이션 바 동적 로드
async function loadNavbar() {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) {
    console.error("🛑 #navbar 요소 없음");
    return;
  }

  try {
    const response = await fetch("./templates/navbar.html");
    const html = await response.text();
    navbarContainer.innerHTML = html;
    console.log("✅ 네비게이션 바 로드 완료");

    checkLogin(); // 네비게이션이 로드된 뒤 버튼에 이벤트 연결
  } catch (err) {
    console.error("🛑 navbar 로딩 실패:", err);
  }
}

// 📌 로그인 상태 확인 → 버튼 표시 제어
async function checkLogin() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  const loginBtn = document.querySelector("#login-btn");
  const logoutBtn = document.querySelector("#logout-btn");

  if (!loginBtn || !logoutBtn) {
    console.warn(
      "🔸 로그인/로그아웃 버튼 없음 (아마 네비게이션 미포함 페이지)"
    );
    return;
  }

  if (error || !sessionData?.session) {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    loginBtn.addEventListener("click", () => {
      window.location.href = "./login.html";
    });
  } else {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    logoutBtn.addEventListener("click", signOutAndReload);
  }
}

// 📌 로그아웃
async function signOutAndReload() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("🛑 로그아웃 실패:", error.message);
    alert("로그아웃 중 문제가 발생했어요.");
  } else {
    console.log("✅ 로그아웃 완료");
    window.location.reload(); // 새로고침으로 상태 초기화
  }
}
