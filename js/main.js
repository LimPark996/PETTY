import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js 로드됨");
  await loadNavbar();

  fetch("templates/footer.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("footer").innerHTML = html;
  });

});

// 📌 네비게이션 바 동적 로드
async function loadNavbar() {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) {
    console.error("🛑 #navbar 요소 없음");
    return;
  }

  try {
    const response = await fetch("asset/navbar.html");
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
    console.warn("🔸 로그인/로그아웃 버튼 없음 (아마 네비게이션 미포함 페이지)");
    return;
  }

  // 기존 이벤트 제거 (중복 방지용)
  const newLoginBtn = loginBtn.cloneNode(true);
  loginBtn.replaceWith(newLoginBtn); // 버튼 새로 교체
  const newLogoutBtn = logoutBtn.cloneNode(true);
  logoutBtn.replaceWith(newLogoutBtn);

  if (error || !sessionData?.session) {
    newLoginBtn.style.display = "inline-block";
    newLogoutBtn.style.display = "none";

    newLoginBtn.addEventListener("click", () => {
      console.log("🔐 로그인 페이지로 이동");
      window.location.href = "./login.html";
    });
  } else {
    newLoginBtn.style.display = "none";
    newLogoutBtn.style.display = "inline-block";

    newLogoutBtn.addEventListener("click", signOutAndReload);
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
