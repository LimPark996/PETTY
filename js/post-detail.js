// ✅ js/post-detail.js
import { getCurrentUserId } from "./auth.js";
import { loadComments, addComment } from "./comments.js";

// 📌 게시글 상세 정보 로딩
async function loadPostDetail(postId) {
  const spinner = document.querySelector("#spinnerContainer");
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`);
    const post = await response.json();

    if (!post) {
      alert("게시글을 찾을 수 없습니다.");
      window.location.href = "community.html";
      return;
    }

    const createdDate = new Date(post.created_at).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });

    const updatedDate = post.updated_at
      ? new Date(post.updated_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        })
      : null;
    const isUpdated = post.updated_at && post.updated_at !== post.created_at;

    let dateText = isUpdated
      ? `<div class="text-muted">수정됨: ${updatedDate}</div>`
      : `<div class="text-muted">작성일: ${createdDate}</div>`;

    let imageTag = post.image_url
      ? `<img src="${post.image_url}" class="img-fluid rounded mb-3 postDetailImg" alt="게시물 이미지">`
      : "";
    spinner.style.display = "none";
    document.getElementById("postDetail").innerHTML = `
      <div class="card shadow-lg p-4">
        <h2>${post.title}</h2>
          ${imageTag}
          <h4>${post.content}</h4>
          <p class="dataText">${dateText}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error:", error);
    alert("게시글을 불러오는 중 오류가 발생했습니다.");
    window.location.href = "community.html";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  const goBackBtn = document.getElementById("goBackBtn");
  const addCommentButton = document.getElementById("addCommentButton");

  if (!postId) {
    alert("게시글을 찾을 수 없습니다.");
    window.location.href = "community.html";
    return;
  }

  goBackBtn.addEventListener("click", function () {
    const basePath = window.location.pathname.split("/").slice(0, -1).join("/");
    window.location.href = `${basePath}/community.html`;
  });

  addCommentButton.addEventListener("click", () => addComment(postId));

  document
    .getElementById("commentInput")
    .addEventListener("focus", async function () {
      if (!(await getCurrentUserId())) {
        alert("댓글을 작성하려면 로그인이 필요합니다.");
        this.blur();
      }
    });

  await loadPostDetail(postId);
  await loadComments(postId);
});
