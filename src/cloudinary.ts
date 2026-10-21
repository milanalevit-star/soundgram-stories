const CLOUD_NAME = "c5fk18vn";
const UPLOAD_PRESET = "soundgram_stories_test";

export async function uploadToCloudinary(
  imageURL: string
): Promise<string> {
  // Преобразуем PNG из Data URL в Blob без fetch(dataURL).
  const parts = imageURL.split(",");

  if (
    parts.length !== 2 ||
    !parts[0].startsWith("data:image/png;base64")
  ) {
    throw new Error("INVALID_PNG_DATA");
  }

  let imageBlob: Blob;

  try {
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    imageBlob = new Blob([bytes], {
      type: "image/png",
    });
  } catch {
    throw new Error("PNG_CONVERSION_FAILED");
  }

  console.log(
    "Размер PNG:",
    (imageBlob.size / 1024 / 1024).toFixed(2),
    "МБ"
  );

  const formData = new FormData();

  formData.append(
    "file",
    imageBlob,
    "soundgram-story.png"
  );

  formData.append("upload_preset", UPLOAD_PRESET);

  let uploadResponse: Response;

  try {
    uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
  } catch (error) {
    console.error("Сетевая ошибка Cloudinary:", error);
    throw new Error("CLOUDINARY_NETWORK_ERROR");
  }

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    console.error(
      "Ошибка Cloudinary:",
      uploadResponse.status,
      errorText
    );

    throw new Error(
      `CLOUDINARY_HTTP_${uploadResponse.status}`
    );
  }

  const result = await uploadResponse.json();

  if (
    typeof result.secure_url !== "string" ||
    !result.secure_url.startsWith("https://")
  ) {
    throw new Error("CLOUDINARY_INVALID_RESPONSE");
  }

  return result.secure_url;
}

export async function uploadAvatarToCloudinary(
  avatarUrl: string
): Promise<string> {
  const formData = new FormData();

  formData.append("file", avatarUrl);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ошибка загрузки аватара (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  return result.secure_url as string;
}