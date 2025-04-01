// ✅ 전역 상수 및 초기화
const baseUrl = "https://typical-aquatic-moose.glitch.me";

fetch("https://typical-aquatic-moose.glitch.me/test-body", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ message: "테스트입니다", from: "유미" })
})
  .then(res => res.json())
  .then(data => console.log("🎉 서버 응답:", data))
  .catch(err => console.error("❌ 요청 실패:", err));

let map = null;

// ✅ Kakao 지도 SDK 로딩 확인 함수
function waitForKakaoMap(callback) {
  if (window.kakao && window.kakao.maps) {
    callback();
  } else {
    setTimeout(() => waitForKakaoMap(callback), 100);
  }
}

// ✅ 초기 설정
window.addEventListener("load", () => {
  const modal = document.getElementById("mapModal");

  modal.addEventListener("shown.bs.modal", () => {
    waitForKakaoMap(() => {
      const mapContainer = document.getElementById("map");
      const mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 3,
      };
      map = new kakao.maps.Map(mapContainer, mapOption);
      setTimeout(() => kakao.maps.event.trigger(map, "resize"), 100);
    });
  });

  // 버튼 및 드롭다운 설정
  ["petSizeBtn", "isPredatorBtn", "publicAccessBtn", "tourTypeBtn"].forEach(id => {
    setupDropdown(id, id.replace("Btn", "Menu"));
  });

  document.getElementById("fetchButton").addEventListener("click", () => {
    console.log("🔘 정보 찾기 버튼 클릭됨!");
    fetchAllDetails();
  });  
  document.getElementById("searchButton").addEventListener("click", handleSearch);
  document.getElementById("confirmLocation").addEventListener("click", handleConfirmLocation);
});

// ✅ 드롭다운 버튼 텍스트 변경
function setupDropdown(buttonId, menuId) {
  const button = document.getElementById(buttonId);
  const menu = document.getElementById(menuId);

  menu.querySelectorAll("label").forEach((label) => {
    label.addEventListener("click", () => {
      const input = label.querySelector('input[type="radio"]');
      if (input && input.value) {
        button.textContent = input.value;
      }
    });
  });
}

function getSelectedTourValue() {
  const selectedRadio = document.querySelector('input[name="tourType"]:checked');
  return selectedRadio ? selectedRadio.value : "";
}

function ensureSelectedLatLng() {
  if (!window.selectedLatlng) window.selectedLatlng = {};
  window.selectedLatlng.lat ??= 37.566842224638414;
  window.selectedLatlng.lng ??= 126.97865225753738;
}

function handleSearch() {
  const keyword = document.getElementById("keywordInput").value.trim();
  if (!keyword) return;

  const ps = new kakao.maps.services.Places();
  ps.keywordSearch(keyword, function (data, status) {
    if (status === kakao.maps.services.Status.OK) {
      const coords = new kakao.maps.LatLng(data[0].y, data[0].x);
      map.setCenter(coords);
      new kakao.maps.Marker({ map, position: coords });
      window.selectedLatlng = { lat: data[0].y, lng: data[0].x };
      window.selectedAddress = data[0].place_name;
    } else {
      alert("검색 결과가 없습니다");
    }
  });
}

function handleConfirmLocation() {
  const locInput = document.getElementById("locationInput");
  locInput.value = window.selectedAddress || `좌표: ${window.selectedLatlng?.lat}, ${window.selectedLatlng?.lng}`;
  const modal = bootstrap.Modal.getInstance(document.getElementById("mapModal"));
  modal.hide();
}

async function fetchBaseList(tourValue) {
  try {
    const { lat, lng } = window.selectedLatlng;
    const response = await fetch(`${baseUrl}/baselist?tourValue=${tourValue}&lat=${lat}&lng=${lng}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("❌ 기본 목록 조회 실패:", error);
    return [];
  }
}

async function fetchDetail(contentId) {
  try {
    const response = await fetch(`${baseUrl}/tour/detail?contentId=${contentId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ ${contentId} 상세 조회 실패:`, error);
    return null;
  }
}

async function fetchAllDetails() {
  ensureSelectedLatLng();
  const tourValueName = getSelectedTourValue();  // 예: "음식점"
  const tourValue = {
    "관광지":12,
    "문화시설":14,
    "축제공연행사":15,
    "여행코스":25,
    "레포츠":28,
    "숙박":32,
    "쇼핑":38,
    "음식점":39
  }[tourValueName]; // → 숫자 ID로 변환
  const data = await fetchBaseList(tourValue);
  if (data.length === 0) return displayEmptyMessage();

  const contentIds = data.map(item => item.contentid);
  const detailsArray = await Promise.all(contentIds.map(fetchDetail));

  const detailsString = detailsArray.map((detail, i) => {
    if (!detail?.[0]) return null;
    const item = detail[0];
    const info = data[i];
    const addr = `${info.addr1} ${info.addr2}`;
    return `${i}번 장소 이름: ${info.title} 상세 주소: ${addr} 사고 예방: ${item.relaAcdntRiskMtr}, 동반 구역: ${item.acmpyTypeCd}, 관련 시설: ${item.relaPosesFclty}, 용품: ${item.relaFrnshPrdlst}, 기타: ${item.etcAcmpyInfo}, 구매 가능: ${item.relaPurcPrdlst}, 기준: ${item.acmpyPsblCpam}, 대여: ${item.relaRntlPrdlst}, 조건: ${item.acmpyNeedMtr}`;
  }).filter(Boolean).join("\n");

  const prompt = `숙소 정보:\n${detailsString}\n반려동물 정보:\n${collectPetInfo()}`;
  console.log("📌 Gemini에 보낼 프롬프트:", prompt);

  try {
    const response = await fetch(`${baseUrl}/gemini?type=${tourValue}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: prompt }),
    });
    const raw = await response.text(); // ← JSON으로 파싱하기 전에 raw로 먼저 받아보기
    console.log("🧪 Gemini 응답(raw):", raw);
    const json = JSON.parse(raw); // ← 이제 파싱
    console.log("🧪 Gemini 응답:", json);
    const infoList = JSON.parse(json.reply);
    displayInfo(infoList, data, tourValue);
  } catch (err) {
    console.error("❌ Gemini API 호출 실패:", err);
    displayEmptyMessage();
  }
  console.log("🧪 contentIds:", contentIds);
  console.log("🧪 detailsArray:", detailsArray);
  console.log("🧪 detailsString:", detailsString);
}

function collectPetInfo() {
  const val = (id, fallback = "선택 안 함") => document.getElementById(id)?.textContent?.trim() || fallback;
  return `이름: ${document.getElementById("petName").value.trim()}, 종: ${document.getElementById("petSpecies").value.trim()}, 크기: ${val("petSizeBtn")}, 맹수 여부: ${val("isPredatorBtn")}, 공공장소 동행 가능 여부: ${val("publicAccessBtn")}`;
}

function displayEmptyMessage() {
  document.getElementById("spinner").innerHTML = "";
  document.getElementById("result").innerHTML = `<p>조회된 관광/숙소 정보가 없습니다.</p>`;
}

function displayInfo(infoList, data, tourValue) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";
  if (!infoList || infoList[0] === -1 || infoList.length === 0) return displayEmptyMessage();

  infoList.forEach((placeInfo, index) => {
    const item = data.find(d => d.contentid === placeInfo.NUMBER);
    const div = document.createElement("div");
    div.className = "info-card";
    div.id = `${tourValue}-${index}`;
    div.innerHTML = `
      <h3 class="info-name">${item.title}</h3>
      <p class="info-address">📍 ${item.addr1} ${item.addr2}</p>
      <img class="info-image" src="${item.firstimage || "../asset/notfound.png"}" alt="${item.title}" style="width: 50%;" />
      <p class="info-description">🔍 ${placeInfo.INFO?.trim() || "정보 없음"}</p>
      <p class="info-hours">📅 ${placeInfo.TIME?.trim() || "정보 없음"}</p>
      <p class="info-phone">📞 ${item.tel?.trim() || "정보 없음"}</p>
    `;
    resultDiv.appendChild(div);
  });
  document.getElementById("spinner").innerHTML = "";
}
