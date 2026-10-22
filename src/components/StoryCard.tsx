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
import { getGenreColor } from "../genreColors"
type StoryCardProps = {
  name: string;
  username: string;
  genreAura: GenreAuraResponse;
  topArtists: TopArtistsResponse;
  canShare?: boolean;
  avatarUrl?: string | null;
  tracksCount?: number | null;
};

async function createStoryPng(
  card: HTMLDivElement,
  avatarCdnUrl: string | null = null
): Promise<string> {
  const pixelRatio = 3;

    const backgroundUrl = await toPng(card, {
        pixelRatio,
        backgroundColor: "#00005a",

        filter: (node) => {
          if (node instanceof HTMLImageElement) {
            return false;
          }

          if (node instanceof HTMLCanvasElement) {
            return false;
          }

          if (
            node instanceof HTMLElement &&
            (
              node.classList.contains("artist-avatar") ||
              node.classList.contains("artist-name") ||
              node.classList.contains("story-genres")
            )
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

  // ========================================
  // ФОТОГРАФИИ И ЗАГЛУШКИ АРТИСТОВ
  // ========================================

  // Собираем всех артистов, а не отдельно фотографии и заглушки.
  const artistItems = Array.from(
    card.querySelectorAll<HTMLElement>(".artist-item")
  );

  // Сортируем по z-index.
  // Элементы с большим z-index рисуем последними.
  artistItems.sort((a, b) => {
    const zA = Number.parseInt(
      window.getComputedStyle(a).zIndex,
      10
    ) || 0;

    const zB = Number.parseInt(
      window.getComputedStyle(b).zIndex,
      10
    ) || 0;

    return zA - zB;
  });

  for (const artistItem of artistItems) {
    const avatar = artistItem.querySelector<HTMLElement>(
      ".artist-avatar"
    );

    if (!avatar) continue;

    const img = avatar.querySelector<HTMLImageElement>("img");
    const placeholder = avatar.querySelector<HTMLElement>("span");

    // Ждём фотографию, если она ещё загружается.
    if (img && !img.complete) {
      try {
        await img.decode();
      } catch {
        console.warn(
          `Не удалось загрузить фотографию: ${img.alt}`
        );
      }
    }

    const rect = avatar.getBoundingClientRect();

    const x = (rect.left - cardRect.left) * scaleX;
    const y = (rect.top - cardRect.top) * scaleY;

    const width = rect.width * scaleX;
    const height = rect.height * scaleY;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2;

    const hasLoadedImage =
      img !== null &&
      img.naturalWidth > 0 &&
      img.naturalHeight > 0;

    if (hasLoadedImage && img) {
      // Рисуем фотографию внутри круглой маски.
      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight;

      const sourceSize = Math.min(
        sourceWidth,
        sourceHeight
      );

      const sourceX = (sourceWidth - sourceSize) / 2;
      const sourceY = (sourceHeight - sourceSize) / 2;

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
    } else {
      // Рисуем заглушку, если фотография недоступна.
      const avatarStyle = window.getComputedStyle(avatar);
      const currentPlaceholder =
        avatar.querySelector<HTMLElement>("span") ?? placeholder;

      const textStyle = currentPlaceholder
        ? window.getComputedStyle(currentPlaceholder)
        : avatarStyle;

      ctx.save();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = avatarStyle.backgroundColor;
      ctx.fillRect(x, y, width, height);

      ctx.font = `${textStyle.fontWeight} ${
        parseFloat(textStyle.fontSize) * scaleY
      }px ${textStyle.fontFamily}`;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = textStyle.color;

      ctx.fillText(
        currentPlaceholder?.textContent?.trim() || "♪",
        centerX,
        centerY
      );

      ctx.restore();
    }
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

    // ========================================
    // ДОБАВЛЯЕМ ОРИГИНАЛЬНЫЙ ЛОГОТИП В PNG
    // ========================================

    const logoElement = card.querySelector<HTMLImageElement>(
      ".soundgram-wordmark"
    );

    if (logoElement) {
      // Дожидаемся загрузки SVG.
      const logoImage = new Image();
      logoImage.src = logoElement.src;

      await logoImage.decode();

      // Определяем положение логотипа относительно карточки.
      const logoRect = logoElement.getBoundingClientRect();

      const logoX = (logoRect.left - cardRect.left) * scaleX;
      const logoY = (logoRect.top - cardRect.top) * scaleY;

      const logoWidth = logoRect.width * scaleX;
      const logoHeight = logoRect.height * scaleY;

      // Рисуем оригинальный SVG поверх остальных элементов.
      ctx.drawImage(
        logoImage,
        logoX,
        logoY,
        logoWidth,
        logoHeight
      );
    }

    // ========================================
    // РИСУЕМ ЖАНРЫ ПОВЕРХ МУЗЫКАЛЬНОЙ АУРЫ
    // ========================================

    const genreElements = Array.from(
      card.querySelectorAll<HTMLElement>(".story-genre")
    );

    for (const genreElement of genreElements) {
      const dot = genreElement.querySelector<HTMLElement>(
        ".story-genre-color"
      );

      const name = genreElement.querySelector<HTMLElement>(
        ".story-genre-name"
      );

      const percent = genreElement.querySelector<HTMLElement>(
        ".story-genre-percent"
      );

      if (!dot || !name || !percent) continue;

      // Цветной маркер.
      const dotRect = dot.getBoundingClientRect();
      const dotStyles = window.getComputedStyle(dot);

      const dotX =
        (dotRect.left - cardRect.left) * scaleX;

      const dotY =
        (dotRect.top - cardRect.top) * scaleY;

      const dotRadius =
        (Math.min(dotRect.width * scaleX, dotRect.height * scaleY)) / 2;

      ctx.save();

      ctx.beginPath();
      ctx.arc(
        dotX + (dotRect.width * scaleX) / 2,
        dotY + (dotRect.height * scaleY) / 2,
        dotRadius,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = dotStyles.backgroundColor;
      ctx.fill();

      ctx.restore();

      // Название жанра и процент.
      for (const element of [name, percent]) {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);

        const x = (rect.left - cardRect.left) * scaleX;
        const y =
          (rect.top + rect.height / 2 - cardRect.top) * scaleY;

        const fontSize = parseFloat(styles.fontSize) * scaleY;

        ctx.save();

        ctx.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
        ctx.fillStyle = styles.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.fillText(element.textContent?.trim() ?? "", x, y);

        ctx.restore();
      }
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
    const [shareStage, setShareStage] = useState<
      "photos" | "render" | "upload" | null
    >(null);
    const [fallbackImageUrl, setFallbackImageUrl] =
      useState<string | null>(null);

    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const hasMusicData =
      genreAura.items.some((genre) => genre.share > 0) ||
      topArtists.items.length > 0;
    // Выбираем три ведущих жанра для карточки Stories.
    const topGenres = genreAura.items
      .filter(
        (genre) =>
          Number.isFinite(genre.share) && genre.share > 0
      )
      .sort((a, b) => b.share - a.share)
      .slice(0, 3);

    // Считаем сумму долей для корректного отображения процентов.
    const totalGenreShare = genreAura.items.reduce(
      (sum, genre) =>
        sum +
        (Number.isFinite(genre.share) && genre.share > 0
          ? genre.share
          : 0),
      0
    );

    const handleShareStory = async () => {
      if (!cardRef.current || isSharing) return;

      const tg = window.Telegram?.WebApp;
      const startTime = performance.now();

      setIsSharing(true);
      setFallbackImageUrl(null);
      setShareMessage(null);
      setShareStage("photos");

      try {
        // 1. Подготавливаем аватар.
        let avatarCdnUrl: string | null = null;

        if (avatarUrl && !avatarError) {
          try {
            avatarCdnUrl = await uploadAvatarToCloudinary(avatarUrl);
          } catch (error) {
            console.warn("Не удалось загрузить аватар:", error);
          }
        }

        setShareStage("render");

        // 2. Создаём изображение Stories.
        const imageUrl = await createStoryPng(
          cardRef.current,
          avatarCdnUrl
        );

        setShareStage("upload");

        // 3. Загружаем PNG, чтобы получить публичную ссылку.
        const publicUrl = await uploadToCloudinary(imageUrl);

        // Сохраняем ссылку для альтернативного способа.
        setFallbackImageUrl(publicUrl);

        // 4. Проверяем возможность открытия редактора Stories.
        const canShareToStory =
          tg != null &&
          tg.isVersionAtLeast("7.8") &&
          typeof tg.shareToStory === "function";

        if (!canShareToStory || typeof tg?.shareToStory !== "function") {
          setShareMessage(
            "На этом устройстве публикация через Telegram недоступна. " +
            "Ты можешь открыть изображение и сохранить его вручную."
          );
          return;
        }

        // Пока не прикрепляем widget_link:
        // переход в настоящий профиль SOUNDGRAM ещё не настроен.
        try {
          const isPremium =
            tg.initDataUnsafe.user?.is_premium === true;

          const profileUrl =
            "https://t.me/soundgram_app_bot?startapp=Jgu316un";

          tg.shareToStory(publicUrl, {
            text: isPremium
              ? "Моя музыкальная аура в SOUNDGRAM 🎵"
              : `Моя музыкальная аура в SOUNDGRAM 🎵\nМой профиль: ${profileUrl}`,

            ...(isPremium
              ? {
                  widget_link: {
                    url: profileUrl,
                    name: "Мой SOUNDGRAM",
                  },
                }
              : {}),
          });

          setShareMessage(
            "Если редактор Stories не открылся, " +
            "воспользуйся ссылкой на изображение ниже."
          );
        } catch (error) {
          console.error("Не удалось подготовить историю:", error);

          const errorCode =
            error instanceof Error
              ? error.message
              : "UNKNOWN_ERROR";

          setShareMessage(
            `Не удалось подготовить изображение. Код: ${errorCode}`
          );
        }
      } catch (error) {
        console.error("Не удалось подготовить историю:", error);

        const errorCode =
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR";

        setShareMessage(
          `Не удалось подготовить изображение. Код: ${errorCode}`
        );
      } finally {
        console.log(
          `Подготовка Stories: ${
            ((performance.now() - startTime) / 1000).toFixed(2)
          } сек.`
        );

        setIsSharing(false);
        setShareStage(null);
      }
    };

  return (
    <>
    <div className="story-preview">
      <div className="story-card" ref={cardRef}>

      <header className="story-header">
        {/* Никнейм пользователя */}
        {username && (
          <p className="story-header-username">
            @{username}
          </p>
        )}

        {/* Аватар и имя */}
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

            {tracksCount != null &&
              Number.isFinite(tracksCount) &&
              tracksCount >= 0 && (
                <div className="story-profile-stat">
                  <span className="story-profile-count">
                    {tracksCount}
                  </span>
                  <span className="story-profile-label">
                    Треки
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Жанры под профилем */}
        {hasMusicData && topGenres.length > 0 && (
          <div className="story-genres">
            {topGenres.map((genre) => (
              <div className="story-genre" key={genre.genre_id}>
                <span
                  className="story-genre-color"
                  style={{
                    backgroundColor: getGenreColor(genre.genre_id),
                  }}
                />

                <span className="story-genre-name">
                  {genre.name}
                </span>

                <span className="story-genre-percent">
                  {Math.round(
                    (genre.share / totalGenreShare) * 100
                  )}%
                </span>
              </div>
            ))}
          </div>
        )}
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

            <h3>
              Твоя музыкальная аура пока не сформирована
            </h3>

            <p>
              Добавь первые треки, чтобы увидеть
              свой музыкальный портрет.
            </p>
          </div>
        )}
      </main>

      <footer className="story-footer">
        <img
          className="soundgram-wordmark"
          src="/icons/soundgram-wordmark.svg"
          alt="SOUNDGRAM"
        />
      </footer>

        </div>
      </div>

      {canShare && (
      <button
        className="story-share-button"
        type="button"
        onClick={handleShareStory}
        disabled={!hasMusicData || isSharing}
      >
        <img
          className="story-share-icon"
          src="/icons/share-profile.png"
          alt=""
          aria-hidden="true"
        />
        <span className="story-share-button-text" aria-live="polite">
          {!hasMusicData
            ? "Музыкальная аура пока недоступна"
            : isSharing
              ? shareStage === "photos"
                ? "Подготавливаем фотографии…"
                : shareStage === "render"
                  ? "Создаём историю…"
                  : shareStage === "upload"
                    ? "Загружаем историю…"
                    : "Подготавливаем историю…"
              : "Поделиться в истории"}
        </span>
      </button>
      )}
      {canShare && shareMessage && (
        <p className="story-share-message" role="status">
          {shareMessage}
        </p>
      )}

      {canShare && fallbackImageUrl && (
        <a
          className="story-fallback-link"
          href={fallbackImageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Открыть изображение истории
        </a>
      )}
    </>
  );
}

export default StoryCard;
