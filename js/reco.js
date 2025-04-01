const baseUrl = "https://typical-aquatic-moose.glitch.me";
let map = null;

// ✅ Kakao 로딩 완료까지 기다리는 함수
function waitForKakaoMap(callback) {
  if (window.kakao && window.kakao.maps) {
    callback();
  } else {
    setTimeout(() => waitForKakaoMap(callback), 100);
  }
}

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
      setTimeout(() => {
        kakao.maps.event.trigger(map, "resize");
      }, 100);
    });
  });

  setupDropdown("petSizeBtn", "petSizeMenu");
  setupDropdown("isPredatorBtn", "isPredatorMenu");
  setupDropdown("publicAccessBtn", "publicAccessMenu");
  setupDropdown("tourTypeBtn", "tourTypeMenu");

  document
    .getElementById("fetchButton")
    .addEventListener("click", fetchAllDetails);
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

async function fetchBaseList(tourValue) {
  try {
    const { lat, lng } = window.selectedLatlng;
    const response = await fetch(
      `${baseUrl}/baselist?tourValue=${tourValue}&lat=${lat}&lng=${lng}`
    );
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
  const tourValue = getSelectedTourValue();
  const data = await fetchBaseList(tourValue);

  if (data.length === 0) {
    displayEmptyMessage();
    return;
  }

  const contentIds = data.map((item) => item.contentid);
  const detailsArray = await Promise.all(contentIds.map(fetchDetail));

  const detailsString = detailsArray
    .map((detail, i) => {
      if (!detail?.[0]) return null;
      const item = detail[0];
      const info = data[i];
      const addr = `${info.addr1} ${info.addr2}`;
      return `${i}번 장소 이름: ${info.title} 상세 주소: ${addr} 사고 예방: ${item.relaAcdntRiskMtr}, 동반 구역: ${item.acmpyTypeCd}, 관련 시설: ${item.relaPosesFclty}, 용품: ${item.relaFrnshPrdlst}, 기타: ${item.etcAcmpyInfo}, 구매 가능: ${item.relaPurcPrdlst}, 기준: ${item.acmpyPsblCpam}, 대여: ${item.relaRntlPrdlst}, 조건: ${item.acmpyNeedMtr}`;
    })
    .filter(Boolean)
    .join("\n");

  const petInfo = collectPetInfo();
  const prompt = `숙소 정보:\n${detailsString}\n반려동물 정보:\n${petInfo}`;
  console.log("📌 Gemini에 보낼 프롬프트:", prompt);

  try {
    const response = await fetch(`${baseUrl}/gemini?type=${tourValue}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: prompt }),
    });

    const json = await response.json();
    const infoList = JSON.parse(json.reply);

    displayInfo(infoList, data, tourValue);
  } catch (err) {
    console.error("❌ Gemini API 호출 실패:", err);
    displayEmptyMessage();
  }
}

function collectPetInfo() {
  const val = (id, fallback = "선택 안 함") =>
    document.getElementById(id)?.textContent?.trim() || fallback;

  return `이름: ${document.getElementById("petName").value.trim()}, 종: ${document.getElementById("petSpecies").value.trim()}, 크기: ${val("petSizeBtn")}, 맹수 여부: ${val("isPredatorBtn")}, 공공장소 동행 가능 여부: ${val("publicAccessBtn")}`;
}

function displayEmptyMessage() {
  document.getElementById("spinner").innerHTML = "";
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `<p>조회된 관광/숙소 정보가 없습니다.</p>`;
}

function displayInfo(infoList, data, tourValue) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  if (!infoList || infoList[0] === -1 || infoList.length === 0) {
    displayEmptyMessage();
    return;
  }

  infoList.forEach((placeInfo, index) => {
    const item = data[placeInfo.NUMBER];
    const div = document.createElement("div");
    div.className = "info-card";
    div.id = `${tourValue}-${index}`;

    div.innerHTML = `
      <h3 class="info-name">${item.title}</h3>
      <p class="info-address">📍 ${item.addr1} ${item.addr2}</p>
      <img class="info-image" src="${item.firstimage || "./asset/notfound.png"}" alt="${item.title}" style="width: 50%;" />
      <p class="info-description">🔍 ${placeInfo.INFO?.trim() || "정보 없음"}</p>
      <p class="info-hours">📅 ${placeInfo.TIME?.trim() || "정보 없음"}</p>
      <p class="info-phone">📞 ${item.tel?.trim() || "정보 없음"}</p>
    `;
    resultDiv.appendChild(div);
  });

  document.getElementById("spinner").innerHTML = "";
}

document
  .getElementById("fetchButton")
  .addEventListener("click", fetchAllDetails);