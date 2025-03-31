// post.js (리팩토링 버전)
import { getAccessToken, getCurrentUserId } from "/PETTY/js/auth.js";
import { uploadImageToSupabase } from "/PETTY/js/upload.js";

const API_URL = "https://big-adventurous-kettledrum.glitch.me";

/** 로그인 상태 확인 */
async function checkLoginStatus() {
  const userId = await getCurrentUserId();
  return !!userId;
}

/** 게시글 로드 */
export async function loadPosts() {
  const response = await fetch(`${API_URL}/posts`);
  const postList = document.getElementById("postList");
  const spinner = document.querySelector("#spinnerContainer");

  if (!response.ok) {
    console.error("🛑 서버 오류:", await response.text());
    return;
  }

  const posts = await response.json();
  if (!Array.isArray(posts)) {
    console.error("🛑 배열이 아닌 데이터:", posts);
    return;
  }

  postList.innerHTML = "";
  for (const post of posts) {
    await createPostElement(post);
  }
  if (spinner) spinner.style.display = "none";
}

/** 게시글 생성 요소 */
async function createPostElement(post) {
  const postList = document.getElementById("postList");
  const postDiv = document.createElement("div");
  postDiv.className = "col-md-4 mb-4";

  const created = new Date(post.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
  const updated =
    post.updated_at && post.updated_at !== post.created_at
      ? new Date(post.updated_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        })
      : null;

  const currentUserId = await getCurrentUserId();
  const isAuthor = currentUserId === post.user_id;

  postDiv.innerHTML = `
    <div class="card shadow-sm">
      <div id="view-mode-${post.id}">
        <a href="post-detail.html?id=${
          post.id
        }" class="text-decoration-none text-dark">
          ${
            post.image_url
              ? `<img src="${post.image_url}" class="card-img-top" alt="게시물 이미지">`
              : ""
          }
          <div class="card-body">
            <h5 class="card-title">${post.title}</h5>
            <p class="card-text">${post.content.substring(0, 50)}...</p>
            <div class="text-muted">
              ${updated ? `✏ 수정됨: ${updated}` : `📅 작성일: ${created}`}
            </div>
          </div>
        </a>
        ${
          isAuthor
            ? `
          <div class="d-flex justify-content-between mt-3 p-2">
            <button class="btn btn-sm btn-outline-primary" onclick="goToEditPage('${post.id}')">✏ 수정</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deletePost('${post.id}')">🗑 삭제</button>
          </div>`
            : ""
        }
      </div>
    </div>`;

  postList.appendChild(postDiv);
}

/** 게시글 작성 */
export async function savePost(title, content, imageFile) {
  const access_token = await getAccessToken();
  if (!access_token) return alert("로그인이 필요합니다!");

  let imageUrl = null;
  if (imageFile) {
    try {
      imageUrl = await uploadImageToSupabase(imageFile);
    } catch (err) {
      return alert("이미지 업로드 실패!");
    }
  }

  const response = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ title, content, image_url: imageUrl }),
  });

  if (response.ok) {
    loadPosts();
  } else {
    const result = await response.json();
    alert(`게시글 저장 실패: ${result.error}`);
  }
}

/** 게시글 삭제 */
export async function deletePost(postId) {
  const access_token = await getAccessToken();
  if (!access_token) return alert("로그인이 필요합니다!");
  const confirmDelete = confirm("정말로 삭제하시겠습니까?");
  if (!confirmDelete) return;

  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.ok) {
    alert("게시글 삭제 완료");
    loadPosts();
  } else {
    alert("게시글 삭제 실패!");
  }
}

/** 글쓰기 버튼 */
document.addEventListener("DOMContentLoaded", () => {
  const addPostBtn = document.getElementById("addPostBtn");
  if (addPostBtn) {
    addPostBtn.addEventListener("click", async () => {
      const isLoggedIn = await checkLoginStatus();
      if (isLoggedIn) {
        window.location.href = "write.html";
      } else {
        alert("로그인이 필요합니다!");
        window.location.href = "login.html";
      }
    });
  }
});

window.goToEditPage = function (postId) {
  window.location.href = `edit.html?id=${postId}`;
};
