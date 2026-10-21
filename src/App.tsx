import { useEffect, useState } from "react";
import "./App.css";

import { genreAura, topArtists } from "./mockData";

import StoryCard from "./components/StoryCard";

// Получаем ID профиля из Telegram-ссылки
function getProfileIdFromTelegram(): string | null {
  const tg = window.Telegram?.WebApp;

  const startParam = tg?.initDataUnsafe?.start_param;

  if (!startParam?.startsWith("profile_")) {
    return null;
  }

  const profileId = startParam.slice("profile_".length);

  return profileId || null;
}

function App() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) return;

    // Сообщаем Telegram, что приложение готово.
    tg.ready();

    // Разворачиваем Mini App на доступную высоту.
    tg.expand();

    // Полноэкранный режим поддерживается
    // не всеми версиями Telegram.
    if (tg.isVersionAtLeast("8.0")) {
      const fullscreenWebApp = tg as typeof tg & {
        requestFullscreen?: () => void;
      };

      try {
        fullscreenWebApp.requestFullscreen?.();
      } catch (error) {
        console.warn(
          "Не удалось включить полноэкранный режим:",
          error
        );
      }
    }
  }, []);

  const [profileId, setProfileId] = useState<string | null>(
    getProfileIdFromTelegram
  );

  return (
    <div className="app">

      {profileId ? (
        <div className="profile-page">
          <h2>Профиль SOUNDGRAM</h2>

          <div className="profile-avatar">🎵</div>

          <h3>Музыкальный профиль</h3>

          <p>ID пользователя: {profileId}</p>

          <p>
            Здесь будет отображаться музыкальный
            профиль автора истории.
          </p>

          <button
            type="button"
            onClick={() => setProfileId(null)}
          >
            Вернуться к моей ауре
          </button>
        </div>
      ) : (
        <>
          <StoryCard
            avatarUrl={user?.photo_url ?? null}
            tracksCount={178}
            name={user?.first_name ?? "Гость"}
            username={user?.username ?? ""}
            genreAura={genreAura}
            topArtists={topArtists}
            canShare={true}
          />
        </>
      )}
    </div>
  );
}

export default App;