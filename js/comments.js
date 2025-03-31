// 📁 comment.js
import { getCurrentUserId } from "./auth.js";

export async function loadComments(postId) {
  const response = await fetch(`${API_URL}/comments?board_id=${postId}`);
  const comments = await response.json();
  const currentUserId = await getCurrentUserId();

  const commentsDiv = document.getElementById("commentsList");
  commentsDiv.innerHTML = "";

  comments.forEach((comment) => {
    const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });

    let editDeleteButtons = "";
    if (currentUserId && currentUserId === comment.user_id) {
      editDeleteButtons = `
        <button class="btn btn-sm btn-outline-primary" onclick="enableCommentEdit('${comment.id}')">수정</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${comment.id}')">삭제</button>
      `;
    }

    const commentElement = document.createElement("div");
    commentElement.classList.add("comment-box");
    commentElement.id = `comment-${comment.id}`;
    commentElement.innerHTML = `
      <div class="card-body">
        <p class="card-text">${comment.content}</p>
        <small class="text-muted">작성일: ${createdDate}</small>
        <div class="comment-actions d-flex justify-content-end">${editDeleteButtons}</div>
      </div>
    `;
    commentsDiv.appendChild(commentElement);
  });
}

export async function addComment(postId) {
  const userId = await getCurrentUserId();
  if (!userId) {
    alert("로그인이 필요합니다.");
    return;
  }

  const commentInput = document.getElementById("commentInput");
  const content = commentInput.value.trim();
  if (!content) return;

  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board_id: postId, content, user_id: userId }),
  });

  if (response.ok) {
    commentInput.value = "";
    loadComments(postId);
  } else {
    alert("댓글 작성 실패!");
  }
}

export function enableCommentEdit(commentId) {
  const commentDiv = document.getElementById(`comment-${commentId}`);
  const commentContent = commentDiv.querySelector("p").innerText;

  commentDiv.innerHTML = `
    <textarea id="edit-comment-${commentId}" class="form-control">${commentContent}</textarea>
    <button class="btn btn-sm btn-success" onclick="updateComment('${commentId}')">저장</button>
    <button class="btn btn-sm btn-secondary" onclick="loadComments('${commentDiv.dataset.postId}')">취소</button>
  `;
}

export async function updateComment(commentId) {
  const userId = await getCurrentUserId();
  if (!userId) {
    alert("로그인이 필요합니다.");
    return;
  }

  const editContent = document
    .getElementById(`edit-comment-${commentId}`)
    .value.trim();
  if (!editContent) return alert("댓글 내용을 입력하세요.");

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: editContent }),
  });

  if (response.ok) {
    const postId = new URLSearchParams(window.location.search).get("id");
    loadComments(postId);
  } else {
    alert("댓글 수정 실패!");
  }
}

export async function deleteComment(commentId) {
  const userId = await getCurrentUserId();
  if (!userId) {
    alert("로그인이 필요합니다.");
    return;
  }

  const confirmDelete = confirm("댓글을 삭제하시겠습니까?");
  if (!confirmDelete) return;

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: "DELETE",
  });

  if (response.ok) {
    alert("댓글이 삭제되었습니다.");
    const postId = new URLSearchParams(window.location.search).get("id");
    loadComments(postId);
  } else {
    alert("댓글 삭제 실패!");
  }
}
