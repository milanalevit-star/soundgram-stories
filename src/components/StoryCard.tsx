import type { GenreAuraResponse, TopArtistsResponse } from "../mockData";
import ArtistAvatar from "./ArtistAvatar";
import "./StoryCard.css";
import {toPng} from "html-to-image";
import {
  uploadToCloudinary,
  uploadAvatarToCloudinary,
} from "../cloudinary";
import {useRef, useState} from "react";
import MusicAuraCanvas from "./MusicAuraCanvas";

type StoryCardProps = {
  name: string;
  username: string;
  genreAura: GenreAuraResponse;
  topArtists: TopArtistsResponse;
  canShare?: boolean;
  avatarUrl?: string | null;
  tracksCount: number;
};

async function createStoryPng(
  card: HTMLDivElement,
  avatarCdnUrl: string | null = null
): Promise<string> {
  const pixelRatio = 3;

    const backgroundUrl = await toPng(card, {
        pixelRatio,
        backgroundColor: "#111233",

        filter: (node) => {
            if (node instanceof HTMLImageElement) {
                return false;
            }

            if (node instanceof HTMLCanvasElement) {
                return false;
            }

            if (
                node instanceof HTMLElement &&
                node.classList.contains("artist-name")
            ) {
                return false;
            }

            return true;
        },
    });

  // 2. Загружаем созданный PNG.
  const background = new Image();
  background.src = backgroundUrl;
  await background.decode();

  // 3. Создаём итоговый Canvas.
  const canvas = document.createElement("canvas");

  canvas.width = background.naturalWidth;
  canvas.height = background.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Не удалось создать Canvas");
  }

  ctx.drawImage(background, 0, 0);

  const cardRect = card.getBoundingClientRect();

  const scaleX = canvas.width / cardRect.width;
  const scaleY = canvas.height / cardRect.height;

  // Добавляем Telegram-аватар из Cloudinary.
  if (avatarCdnUrl) {
    const avatarElement =
      card.querySelector<HTMLImageElement>(".telegram-avatar");

    if (avatarElement) {
      // Загружаем новую копию изображения с разрешённым CORS.
      const avatarImage = new Image();

      avatarImage.crossOrigin = "anonymous";
      avatarImage.src = avatarCdnUrl;

      await avatarImage.decode();

      const rect = avatarElement.getBoundingClientRect();

      const x = (rect.left - cardRect.left) * scaleX;
      const y = (rect.top - cardRect.top) * scaleY;

      const width = rect.width * scaleX;
      const height = rect.height * scaleY;

      // Рассчитываем обрезку по принципу object-fit: cover.
      const sourceWidth = avatarImage.naturalWidth;
      const sourceHeight = avatarImage.naturalHeight;

      const sourceSize = Math.min(sourceWidth, sourceHeight);

      const sourceX = (sourceWidth - sourceSize) / 2;
      const sourceY = (sourceHeight - sourceSize) / 2;

      ctx.save();

      // Круглая маска.
      ctx.beginPath();
      ctx.arc(
        x + width / 2,
        y + height / 2,
        Math.min(width, height) / 2,
        0,
        Math.PI * 2
      );

      ctx.clip();

      // Рисуем фотографию.
      ctx.drawImage(
        avatarImage,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        x,
        y,
        width,
        height
      );

      ctx.restore();
    }
  }

  // ========================================
// ДОБАВЛЯЕМ МУЗЫКАЛЬНУЮ АУРУ В PNG
// ========================================

// Находим Canvas, на котором нарисована аура.
    const auraCanvas = card.querySelector<HTMLCanvasElement>(
    ".music-aura-canvas"
    );

    if (auraCanvas) {
        const auraRect = auraCanvas.getBoundingClientRect();

        const auraX =
            (auraRect.left - cardRect.left) * scaleX;

        const auraY =
            (auraRect.top - cardRect.top) * scaleY;

        const auraWidth = auraRect.width * scaleX;
        const auraHeight = auraRect.height * scaleY;

        ctx.save();

        // Рисуем ауру на отдельном Canvas,
        // чтобы маска не затронула остальную карточку.
        const auraLayer = document.createElement("canvas");

        auraLayer.width = Math.round(auraWidth);
        auraLayer.height = Math.round(auraHeight);

        const auraCtx = auraLayer.getContext("2d");

        if (auraCtx) {
            auraCtx.drawImage(
            auraCanvas,
            0,
            0,
            auraLayer.width,
            auraLayer.height
            );

            auraCtx.globalCompositeOperation = "destination-in";

            const layerMask = auraCtx.createLinearGradient(
            0,
            0,
            0,
            auraLayer.height
            );

            layerMask.addColorStop(0, "rgba(0,0,0,0)");
            layerMask.addColorStop(0.14, "rgba(0,0,0,1)");
            layerMask.addColorStop(0.82, "rgba(0,0,0,1)");
            layerMask.addColorStop(1, "rgba(0,0,0,0)");

            auraCtx.fillStyle = layerMask;
            auraCtx.fillRect(
            0,
            0,
            auraLayer.width,
            auraLayer.height
            );

            // Переносим ауру с прозрачными краями.
            ctx.drawImage(
            auraLayer,
            auraX,
            auraY,
            auraWidth,
            auraHeight
            );
        }

        ctx.restore();
    }

  // Находим фотографии артистов.
    const images = Array.from(
        card.querySelectorAll<HTMLImageElement>(
            ".artist-avatar img"
        )
    );

        // Сортируем фотографии по CSS z-index,
        // чтобы порядок наложения совпадал с Mini App.
    images.sort((a, b) => {
        const getZIndex = (img: HTMLImageElement) => {
            const artistItem = img.closest(".artist-item");

            if (!artistItem) return 0;

            const zIndex = window.getComputedStyle(artistItem).zIndex;

            return Number.parseInt(zIndex, 10) || 0;
        };

        return getZIndex(a) - getZIndex(b);
    });

  for (const img of images) {
    if (!img.complete || img.naturalWidth === 0) {
      console.warn(
        `Пропускаем незагруженную фотографию: ${img.alt}`
      );
      continue;
    }

    const rect = img.getBoundingClientRect();

    // Координаты фотографии относительно карточки.
    const x = (rect.left - cardRect.left) * scaleX;
    const y = (rect.top - cardRect.top) * scaleY;

    const width = rect.width * scaleX;
    const height = rect.height * scaleY;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2;

    // 5. Обрезаем фотографию по кругу.
    ctx.save();

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius,
      0,
      Math.PI * 2
    );

    ctx.clip();

    // Аналог CSS object-fit: cover.
    const sourceWidth = img.naturalWidth;
    const sourceHeight = img.naturalHeight;

    const sourceSize = Math.min(
      sourceWidth,
      sourceHeight
    );

    const sourceX = (sourceWidth - sourceSize) / 2;
    const sourceY = (sourceHeight - sourceSize) / 2;

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      x,
      y,
      width,
      height
    );

    ctx.restore();
  }

    const avatarPlaceholders = Array.from(
      card.querySelectorAll<HTMLElement>(".artist-avatar span")
    );

    for (const placeholder of avatarPlaceholders) {
      const rect = placeholder.parentElement?.getBoundingClientRect();

      if (!rect) continue;

      const x = (rect.left - cardRect.left) * scaleX;
      const y = (rect.top - cardRect.top) * scaleY;

      const width = rect.width * scaleX;
      const height = rect.height * scaleY;

      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.min(width, height) / 2;

      ctx.save();

      const avatarElement = placeholder.parentElement;

      if (!avatarElement) continue;

      const avatarStyle = window.getComputedStyle(avatarElement);

      // Рисуем фон таким же цветом, как в Mini App.
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

      ctx.fillStyle = avatarStyle.backgroundColor;
      ctx.fill();

      ctx.font = `${avatarStyle.fontWeight} ${
        parseFloat(avatarStyle.fontSize) * scaleY
      }px ${avatarStyle.fontFamily}`;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = avatarStyle.color;

      ctx.fillText(
        placeholder.textContent?.trim() || "♪",
        centerX,
        centerY
      );

      ctx.restore();
    }
    // ========================================
    // РИСУЕМ ИМЕНА АРТИСТОВ ПОВЕРХ АУРЫ
    // ========================================

    const artistNames = Array.from(
        card.querySelectorAll<HTMLElement>(".artist-name")
    );

    for (const nameElement of artistNames) {
        const rect = nameElement.getBoundingClientRect();
        const styles = window.getComputedStyle(nameElement);

        // Координаты подписи относительно карточки
        const x =
            (rect.left + rect.width / 2 - cardRect.left) * scaleX;

        const y =
            (rect.top + rect.height / 2 - cardRect.top) * scaleY;

        // Получаем размер шрифта из CSS
        const fontSize =
            parseFloat(styles.fontSize) * scaleY;

        ctx.save();

        ctx.font = `300 ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const artistName = nameElement.textContent ?? "";

        const maxWidth = rect.width * scaleX;

        function truncateText(
          text: string,
          maxWidth: number
        ): string {
          if (ctx!.measureText(text).width <= maxWidth) {
            return text;
          }

          let result = text;

          while (
            result.length > 0 &&
            ctx!.measureText(`${result}…`).width > maxWidth
          ) {
            result = result.slice(0, -1);
          }

          return `${result}…`;
        }

        const visibleName = truncateText(artistName, maxWidth);

        ctx.fillStyle = "#FFFFFF";

        ctx.fillText(visibleName, x, y);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.restore();
    }

  // 6. Возвращаем готовый PNG с фотографиями.
  return canvas.toDataURL("image/png");
}

function StoryCard({
  name,
  username,
  genreAura,
  topArtists,
  canShare = true,
  avatarUrl = null,
  tracksCount,
}: StoryCardProps) {

    const cardRef = useRef<HTMLDivElement>(null);
    const [avatarError, setAvatarError] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const hasMusicData =
      genreAura.items.some((genre) => genre.share > 0) ||
      topArtists.items.length > 0;

    const handleDownload = async () => {
      if (!cardRef.current || isSharing) {
        return;
      }

      setIsSharing(true);

      try {
        // Подготавливаем Telegram-аватар для Canvas.
        let avatarCdnUrl: string | null = null;

        if (avatarUrl && !avatarError) {
          avatarCdnUrl = await uploadAvatarToCloudinary(avatarUrl);
        }

        // Создаём PNG с аватаром, музыкальной аурой
        // и фотографиями артистов.
        const imageUrl = await createStoryPng(
          cardRef.current,
          avatarCdnUrl
        );

        // Скачиваем готовую картинку.
        const link = document.createElement("a");
        link.download = "soundgram-story.png";
        link.href = imageUrl;

        document.body.appendChild(link);
        link.click();
        link.remove();

      } catch (error) {
        console.error("Ошибка создания PNG:", error);

        window.alert(
          "Не удалось скачать изображение. Попробуйте ещё раз."
        );
      } finally {
        setIsSharing(false);
      }
    };

    const handleShareStory = async () => {
      if (!cardRef.current || isSharing) return;

      const startTime = performance.now();

        const tg = window.Telegram.WebApp;

        const telegramUserId = tg.initDataUnsafe.user?.id;

        if (!telegramUserId) {
            tg.showAlert(
                "Не удалось определить пользователя Telegram"
            );
            return;
        }

        const profileUrl =
            `https://t.me/SoundGram_stories_test_bot?startapp=profile_${telegramUserId}`;

        if (!tg.isVersionAtLeast("7.8")) {
            tg.showAlert("Обновите Telegram для публикации Stories");
            return;
        }

        let step = "Подготовка аватара";

        setIsSharing(true);

        try {
          // Засекаем время начала загрузки аватара
            const avatarStart = performance.now();

            // Загружаем аватар в Cloudinary
            const avatarCdnUrl = avatarUrl && !avatarError
              ? await uploadAvatarToCloudinary(avatarUrl)
              : null;

          console.log(
            "Аватар:",
            ((performance.now() - avatarStart) / 1000).toFixed(2),
            "сек."
          );

          // 2. Создаём PNG с аватаром, аурой и артистами.
          step = "Создание PNG";

          const pngStart = performance.now();

          const imageUrl = await createStoryPng(
            cardRef.current,
            avatarCdnUrl
          );

          console.log(
            "Создание PNG:",
            ((performance.now() - pngStart) / 1000).toFixed(2),
            "сек."
          );
          // 3. Загружаем готовую историю в Cloudinary.
          step = "Загрузка в Cloudinary";

            const uploadStart = performance.now();
            const publicUrl = await uploadToCloudinary(imageUrl);

            console.log(
              "Загрузка PNG:",
              ((performance.now() - uploadStart) / 1000).toFixed(2),
              "сек."
            );

    // Шаг 3 — открываем Telegram Stories
            step = "Открытие Telegram Stories";

            tg.shareToStory(publicUrl, {
                text: "Моя музыкальная аура в SOUNDGRAM 🎵",
                widget_link: {
                    url: profileUrl,
                    name: "Мой SOUNDGRAM",
                },
            });

        } catch (error) {
            console.error(`Ошибка на этапе: ${step}`, error);

            const message =
                error instanceof Error ? error.message : String(error);

            tg.showAlert(
                `Этап: ${step}\nОшибка: ${message.slice(0, 150)}`
            );
        }
        finally {
          const elapsed = performance.now() - startTime;

          console.log(
              `Подготовка Stories: ${(elapsed / 1000).toFixed(2)} сек.`
          );

          setIsSharing(false);
        }
    };

  return (
    <>
    <div className="story-card" ref={cardRef}>

      <header className="story-header">

        {/* Никнейм сверху по центру */}
        {username && (
          <p className="story-header-username">
            @{username}
          </p>
        )}

        {/* Основная информация профиля */}
        <div className="story-profile">

          <div className="story-profile-avatar">
            {avatarUrl && !avatarError ? (
              <img
                className="telegram-avatar"
                src={avatarUrl}
                alt="Аватар Telegram"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="story-profile-info">

            <h2>{name}</h2>

            <div className="story-profile-stat">
              <span className="story-profile-count">
                {tracksCount}
              </span>

              <span className="story-profile-label">
                Треки
              </span>
            </div>

          </div>

        </div>
      </header>

      <main className="story-content">
        {hasMusicData ? (
          <>
            <h3>Моя музыкальная аура</h3>

            <div className="aura-container">
              <MusicAuraCanvas genreAura={genreAura} />

              <div className="aura-core"></div>

              <div className="story-artists">
                {topArtists.items.slice(0, 3).map((artist) => (
                  <div className="artist-item" key={artist.artist_id}>
                    <ArtistAvatar
                      name={artist.name}
                      imageUrl={artist.image_url}
                    />

                    <span className="artist-name">
                      {artist.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="story-empty">
            <div className="story-empty-icon">♫</div>

            <h3>Твоя музыкальная аура пока не сформирована</h3>

            <p>
              Добавь первые треки, чтобы увидеть
              свой музыкальный портрет.
            </p>
          </div>
        )}
      </main>

      {/* Нижняя часть — логотип */}
    <footer className="story-footer">
        <div className="soundgram-brand">
            S<span className="logo-letter-o">
                O
                <span className="logo-note" aria-hidden="true">♫</span>
            </span>UNDGRAM
        </div>
    </footer>

    </div>

    {canShare && (
      <button
        className="story-share-button"
        type="button"
        onClick={handleShareStory}
        disabled={!hasMusicData || isSharing}
      >
        {!hasMusicData
          ? "Музыкальная аура пока недоступна"
          : isSharing
            ? "Подготавливаем историю…"
            : "Поделиться в истории ✨"}
      </button>
    )}

    <button type="button" onClick={handleDownload}>
        Скачать PNG
    </button>
    </>
  );
}

export default StoryCard;
