import { getCurrentUserId, getAccessToken } from "./js/auth.js";
import { uploadImageToSupabase, deleteImageFromSupabase } from "./js/upload.js";
import { getQueryParam, redirectTo } from "./js/utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const postId = getQueryParam("id");
  if (!postId) return redirectTo("community.html");

  const titleInput = document.getElementById("editTitle");
  const contentInput = document.getElementById("editContent");
  const imageInput = document.getElementById("newImage");
  const currentImage = document.getElementById("currentImage");
  const deleteBtn = document.getElementById("deleteImageBtn");
  const form = document.getElementById("editPostForm");

  let imageUrl = null;

  // 게시글 불러오기
  const res = await fetch(`${API_URL}/posts/${postId}`);
  const post = await res.json();
  if (!post) return redirectTo("community.html");

  // 권한 확인
  const currentUserId = await getCurrentUserId();
  if (currentUserId !== post.user_id) {
    alert("수정 권한이 없습니다!");
    return redirectTo(`post-detail.html?id=${postId}`);
  }

  // 값 채우기
  titleInput.value = post.title;
  contentInput.value = post.content;

  if (post.image_url) {
    currentImage.src = post.image_url;
    currentImage.style.display = "block";
    deleteBtn.style.display = "block";
    imageUrl = post.image_url;
  }

  // 이미지 삭제 버튼
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      await deleteImageFromSupabase(imageUrl);
      imageUrl = null;
      currentImage.style.display = "none";
      deleteBtn.style.display = "none";
      alert("이미지가 삭제되었습니다!");
    } catch (err) {
      alert("이미지 삭제 실패!");
      console.error(err);
    }
  });

  // 수정 제출
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedTitle = titleInput.value.trim();
    const updatedContent = contentInput.value.trim();
    const newImageFile = imageInput.files[0];
    if (!updatedTitle || !updatedContent)
      return alert("제목과 내용을 입력하세요.");

    const access_token = await getAccessToken();
    if (!access_token) return alert("로그인이 필요합니다!");

    try {
      if (newImageFile) {
        imageUrl = await uploadImageToSupabase(newImageFile);
      }

      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          title: updatedTitle,
          content: updatedContent,
          image_url: imageUrl,
        }),
      });

      if (response.ok) {
        alert("게시글이 수정되었습니다!");
        redirectTo(`post-detail.html?id=${postId}`);
      } else {
        alert("게시글 수정 실패!");
      }
    } catch (err) {
      console.error("🛑 수정 중 오류:", err);
      alert("알 수 없는 오류가 발생했습니다.");
    }
  });
});
