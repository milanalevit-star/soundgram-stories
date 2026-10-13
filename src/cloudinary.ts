const CLOUD_NAME = "c5fk18vn";
const UPLOAD_PRESET = "soundgram_stories_test";

export async function uploadToCloudinary(imageURL: string) {
    const response = await fetch(imageURL);
    const imageBlob = await response.blob();

    const formData = new FormData();

    formData.append("file", imageBlob, "soundgram-story.png");
    formData.append("upload_preset", UPLOAD_PRESET);

    const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );
    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();

        throw new Error(
            `Cloudinary (${uploadResponse.status}): ${errorText}`
        );
    }
    const result = await uploadResponse.json();
    return result.secure_url as string;
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