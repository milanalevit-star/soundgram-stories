import { useState } from "react";
import "./App.css";

import {
  genreAura,
  topArtists,
  genreAuraEva,
  topArtistsEva,
  genreAuraAlya,
  topArtistsAlya,
} from "./mockData";

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

  const [profileId, setProfileId] = useState<string | null>(
    getProfileIdFromTelegram
  );

  // Выбранный музыкальный профиль
  const [selectedProfile, setSelectedProfile] =
  useState<"me" | "eva" | "alya">("me");

  const isEva = selectedProfile === "eva";
  const isAlya = selectedProfile === "alya";

  return (
    <div className="app">
      <h1>SOUNDGRAM</h1>

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
          <div className="profile-switcher">
            <button
              type="button"
              onClick={() => setSelectedProfile("me")}
            >
              Моя аура
            </button>

            <button
              type="button"
              onClick={() => setSelectedProfile("eva")}
            >
              Аура Евочки
            </button>

            <button
              type="button"
              onClick={() => setSelectedProfile("alya")}
            >
              Аура Али
            </button>
          </div>

          <StoryCard

            avatarUrl={selectedProfile === "me" ? user?.photo_url ?? null : null}

            tracksCount={
              isEva
                ? 630
                : isAlya
                  ? 1090
                  : 178
            }

            name={
              isEva
                ? "Евочка"
                : isAlya
                  ? "Аля"
                  : user?.first_name ?? "Гость"
            }
            username={
              isEva
                ? "ellviitt"
                : isAlya
                  ? "aalkkkkk"
                  : user?.username ?? ""
            }
            genreAura={
              isEva
                ? genreAuraEva
                : isAlya
                  ? genreAuraAlya
                  : genreAura
            }
            topArtists={
              selectedProfile === "me"
                ? topArtists
                : selectedProfile === "eva"
                  ? topArtistsEva
                  : topArtistsAlya
            }
            canShare={selectedProfile === "me"}
          />
        </>
      )}
    </div>
  );
}

export default App;