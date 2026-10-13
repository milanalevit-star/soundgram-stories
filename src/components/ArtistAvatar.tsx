import { useState } from "react";

type ArtistAvatarProps = {
  name: string;
  imageUrl: string | null;
};

function ArtistAvatar({ name, imageUrl }: ArtistAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showImage = imageUrl !== null && !imageError;

  return (
    <div className="artist-avatar">
      {showImage ? (
        <img
            src={imageUrl}
            alt={name}
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
        />
      ) : (
        <span>{name.charAt(0)}</span>
      )}
    </div>
  );
}

export default ArtistAvatar;