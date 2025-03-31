export async function uploadImageToSupabase(file) {
  const imageName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const { data, error } = await supabase.storage
    .from("images")
    .upload(imageName, file, { cacheControl: "3600", upsert: true });

  if (error) throw new Error("이미지 업로드 실패");

  return `https://cxmqnfubrioqhvnyephd.supabase.co/storage/v1/object/public/images/${imageName}`;
}

export async function deleteImageFromSupabase(imageUrl) {
  const filePath = imageUrl.split("/images/")[1];
  const { error } = await supabase.storage.from("images").remove([filePath]);
  if (error) throw new Error("이미지 삭제 실패");
}
