// ✅ js/vision.js

const API_BASE = "https://victorious-cubic-marionberry.glitch.me";

async function fetchFromGemini(endpoint, payload) {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`${endpoint} API 요청 실패`);
    return await response.text();
  } catch (error) {
    console.error(`🚨 ${endpoint} API 요청 오류:`, error);
    return "🔴 오류 발생: API 요청 실패";
  }
}

async function processImageAnalysis(base64Image, mimeType) {
  console.log("🔄 findAnimal 실행 중...");
  const step1 = await fetchFromGemini("findAnimal", { base64Image, mimeType });

  console.log("🔄 findAnimal2 실행 중...");
  const step2 = await fetchFromGemini("findAnimal2", {
    base64Image,
    mimeType,
    firstprompt: step1,
  });

  console.log("🔄 findAnimal3 실행 중...");
  const finalAnswer = await fetchFromGemini("findAnimal3", {
    base64Image,
    mimeType,
    secondprompt: step2,
  });

  return finalAnswer;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#controller");
  const formContainer = document.querySelector("#formContainer");
  const spinnerContainer = document.querySelector("#spinnerContainer");
  const resultContainer = document.querySelector("#result");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.querySelector("#petName").value;
    const input = document.querySelector("#imageInput");
    const imgBox = document.querySelector("#showImg");
    const content = document.querySelector("#result1");

    content.innerHTML = "";
    imgBox.src = "";
    formContainer.style.display = "none";
    spinnerContainer.style.display = "block";

    if (!input.files || !input.files[0]) {
      alert("🚨 이미지 파일을 선택해주세요.");
      resetUI();
      return;
    }

    try {
      const file = input.files[0];
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("이미지 업로드 실패");

      const { base64Image, mimeType } = await uploadResponse.json();
      console.log("✅ 서버에서 변환된 Base64 데이터 수신 완료!");

      const finalAnswer = await processImageAnalysis(base64Image, mimeType);
      const parsed = finalAnswer.replace(/```html|```/g, "");

      imgBox.src = URL.createObjectURL(file);
      resultContainer.style.display = "block";
      spinnerContainer.style.display = "none";

      const resultElement = document.createElement("p");
      resultElement.innerHTML = `📌 ${name} 분석 결과 : ${parsed}`;
      content.appendChild(resultElement);
    } catch (error) {
      console.error("🚨 처리 중 오류:", error);
      content.innerText =
        "이미지를 분석할 수 없습니다. 다른 이미지를 골라주세요";
      resetUI();
    }
  });

  function resetUI() {
    spinnerContainer.style.display = "none";
    formContainer.style.display = "block";
  }
});
