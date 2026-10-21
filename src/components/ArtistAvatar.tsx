import { useState } from "react";

type ArtistAvatarProps = {
  name: string;
  imageUrl: string | null;
};

function ArtistAvatar({ name, imageUrl }: ArtistAvatarProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const hasImage = Boolean(imageUrl);
  const imageLoaded = hasImage && loadedUrl === imageUrl;
  const imageFailed = hasImage && failedUrl === imageUrl;

  const initial = name.trim().charAt(0).toUpperCase() || "♪";

  return (
    <div className="artist-avatar">
      {!imageLoaded && <span>{initial}</span>}

      {hasImage && !imageFailed && (
        <img
          src={imageUrl!}
          alt={name}
          crossOrigin="anonymous"
          onLoad={() => setLoadedUrl(imageUrl)}
          onError={() => setFailedUrl(imageUrl)}
          style={{
            display: imageLoaded ? "block" : "none",
          }}
        />
      )}
    </div>
  );
}

export default ArtistAvatar;