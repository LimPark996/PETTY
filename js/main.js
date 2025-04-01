import { supabase } from "./supabase.js";

// ✅ 페이지 로드 완료 후 실행
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js 로드됨");
  await loadNavbar();
  await loadFooter();
});

// ✅ 푸터 로드 함수
async function loadFooter() {
  const res = await fetch("templates/footer.html");
  const html = await res.text();
  document.getElementById("footer").innerHTML = html;
}

// ✅ 네비게이션 바 동적 로드
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

    await checkLogin(); // 로드 후 로그인 상태 확인 및 버튼 설정
  } catch (err) {
    console.error("🛑 navbar 로딩 실패:", err);
  }
}

// ✅ 로그인 상태 확인 → 버튼 표시 및 이벤트 연결
async function checkLogin() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  const loginBtn = document.querySelector("#login-btn");
  const logoutBtn = document.querySelector("#logout-btn");
  const userInfo = document.querySelector("#user-info");

  if (!loginBtn || !logoutBtn) {
    console.warn("⚠️ 로그인/로그아웃 버튼 없음");
    return;
  }

  // 버튼 이벤트 중복 방지 위해 복제 후 교체
  const freshLoginBtn = loginBtn.cloneNode(true);
  loginBtn.replaceWith(freshLoginBtn);
  const freshLogoutBtn = logoutBtn.cloneNode(true);
  logoutBtn.replaceWith(freshLogoutBtn);

  // 로그인 안 된 상태
  if (error || !sessionData?.session) {
    freshLoginBtn.style.display = "inline-block";
    freshLogoutBtn.style.display = "none";
    if (userInfo) userInfo.style.display = "none";

    freshLoginBtn.addEventListener("click", () => {
      console.log("➡️ 로그인 페이지로 이동");
      window.location.href = "./login.html";
    });

  // 로그인 된 상태
  } else {
    const user = sessionData.session.user;
    const name = user.user_metadata?.full_name || user.email;

    freshLoginBtn.style.display = "none";
    freshLogoutBtn.style.display = "inline-block";

    if (userInfo) {
      userInfo.textContent = `👋 ${name}`;
      userInfo.style.display = "inline-block";
    }

    freshLogoutBtn.addEventListener("click", signOutAndReload);
  }
}

// ✅ 로그아웃 함수
async function signOutAndReload() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("🛑 로그아웃 실패:", error.message);
    alert("로그아웃 중 문제가 발생했어요.");
  } else {
    console.log("✅ 로그아웃 완료");
    window.location.reload(); // 상태 초기화
  }
}
