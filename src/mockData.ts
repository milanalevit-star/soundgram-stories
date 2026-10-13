// ========================================
// ТИПЫ ДАННЫХ ПО КОНТРАКТУ SOUNDGRAM
// ========================================

export type GenreAuraItem = {
  genre_id: string;
  name: string;

  // Доля жанра: от 0 до 1.
  // Сумма share по всем жанрам = 1.
  share: number;

  tracks_count: number;
};

export type GenreAuraResponse = {
  items: GenreAuraItem[];
};

export type TopArtistItem = {
  artist_id: string;
  name: string;
  tracks_count: number;
  image_url: string | null;
};

export type TopArtistsResponse = {
  items: TopArtistItem[];
};


// ========================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
// НОРМАЛИЗАЦИЯ ДОЛЕЙ ЖАНРОВ
// ========================================

// В интерфейсе SOUNDGRAM проценты отдельных жанров
// могут в сумме не давать 100%.
//
// Для тестовых данных приводим их к контракту API,
// сохраняя относительное распределение жанров.

type GenreMockItem = {
  genre_id: string;
  name: string;
  percent: number;
  tracks_count: number;
};

function normalizeGenres(
  genres: GenreMockItem[]
): GenreAuraResponse {
  const totalPercent = genres.reduce(
    (sum, genre) => sum + genre.percent,
    0
  );

  // Пустая медиатека.
  if (totalPercent === 0) {
    return { items: [] };
  }

  return {
    items: genres.map(({ percent, ...genre }) => ({
      ...genre,
      share: percent / totalPercent,
    })),
  };
}


// ========================================
// ПЕРВЫЙ ПРОФИЛЬ — МИЛАНА
// ========================================

// Все 13 жанров из интерфейса SOUNDGRAM.
//
// Исходные проценты:
// 31 + 15 + 14 + 8 + 6 + 4 + 4 + 3
// + 2 + 2 + 2 + 1 + 1 = 93%.
//
// Для контракта API нормализуем доли до 100%.
//
// tracks_count частично основан на исходных моках,
// остальные значения демонстрационные.

export const genreAura: GenreAuraResponse =
  normalizeGenres([
    {
      genre_id: "rap",
      name: "Рэп",
      percent: 31,
      tracks_count: 55,
    },
    {
      genre_id: "pop",
      name: "Поп",
      percent: 15,
      tracks_count: 27,
    },
    {
      genre_id: "foreign_rap",
      name: "Зарубежный рэп",
      percent: 14,
      tracks_count: 25,
    },
    {
      genre_id: "electronic",
      name: "Электроника",
      percent: 8,
      tracks_count: 14,
    },
    {
      genre_id: "indie",
      name: "Инди",
      percent: 6,
      tracks_count: 11,
    },
    {
      genre_id: "russian_rap",
      name: "Русский рэп",
      percent: 4,
      tracks_count: 7,
    },
    {
      genre_id: "rock",
      name: "Рок",
      percent: 4,
      tracks_count: 7,
    },
    {
      genre_id: "local_indie",
      name: "Локальный инди",
      percent: 3,
      tracks_count: 5,
    },
    {
      genre_id: "alternative",
      name: "Альтернатива",
      percent: 2,
      tracks_count: 4,
    },
    {
      genre_id: "soundtracks",
      name: "Саундтреки",
      percent: 2,
      tracks_count: 4,
    },
    {
      genre_id: "rnb",
      name: "R&B",
      percent: 2,
      tracks_count: 4,
    },
    {
      genre_id: "latin_music",
      name: "Латиноамериканская музыка",
      percent: 1,
      tracks_count: 2,
    },
    {
      genre_id: "soul",
      name: "Соул",
      percent: 1,
      tracks_count: 2,
    },
  ]);


// ========================================
// ТОП АРТИСТОВ — МИЛАНА
// ========================================

export const topArtists: TopArtistsResponse = {
  items: [
    {
      artist_id: "kanye",
      name: "Kanye West",
      tracks_count: 9,
      image_url:
        "https://avatars.yandex.net/get-music-content/15499524/3d804996.p.644/600x600",
    },
    {
      artist_id: "billie",
      name: "Billie Eilish",
      tracks_count: 6,
      image_url:
        "https://avatars.yandex.net/get-music-content/13529784/000021dc.p.4353492/600x600",
    },
    {
      artist_id: "asap",
      name: "A$AP Rocky",
      tracks_count: 5,
      image_url:
        "https://avatars.yandex.net/get-music-content/176019/89e82d5f.p.631822/600x600",
    },
  ],
};


// ========================================
// ВТОРОЙ ПРОФИЛЬ — ЕВОЧКА
// ========================================

// Исходные доли со скриншота SOUNDGRAM.
//
// Сумма отображённых процентов = 78%.
//
// Нормализуем до 100%.
// tracks_count — демонстрационные значения.

export const genreAuraEva: GenreAuraResponse =
  normalizeGenres([
    {
      genre_id: "russian_rap",
      name: "Русский рэп",
      percent: 50,
      tracks_count: 403,
    },
    {
      genre_id: "pop",
      name: "Поп",
      percent: 7,
      tracks_count: 57,
    },
    {
      genre_id: "rap",
      name: "Рэп",
      percent: 7,
      tracks_count: 57,
    },
    {
      genre_id: "russian_pop",
      name: "Русский поп",
      percent: 4,
      tracks_count: 32,
    },
    {
      genre_id: "electronic",
      name: "Электроника",
      percent: 4,
      tracks_count: 32,
    },
    {
      genre_id: "russian_rock",
      name: "Русский рок",
      percent: 2,
      tracks_count: 19,
    },
    {
      genre_id: "foreign_rap",
      name: "Зарубежный рэп",
      percent: 2,
      tracks_count: 19,
    },
    {
      genre_id: "latin_music",
      name: "Латиноамериканская музыка",
      percent: 2,
      tracks_count: 11,
    },
  ]);


// ========================================
// ТОП АРТИСТОВ — ЕВОЧКА
// ========================================

export const topArtistsEva: TopArtistsResponse = {
  items: [
    {
      artist_id: "pharaoh",
      name: "PHARAOH",
      tracks_count: 26,
      image_url:
        "https://avatars.yandex.net/get-music-content/17699177/643cd321.p.4443004/600x600",
    },
    {
      artist_id: "basta",
      name: "Баста",
      tracks_count: 24,
      image_url:
        "https://avatars.yandex.net/get-music-content/20855185/79321e08.p.41191/600x600",
    },
    {
      artist_id: "boulevard_depo",
      name: "Boulevard Depo",
      tracks_count: 18,
      image_url:
        "https://avatars.yandex.net/get-music-content/18172800/a50711f1.p.4480055/600x600",
    },
  ],
};


// ========================================
// ТРЕТИЙ ПРОФИЛЬ — АЛЯ
// ========================================

// Сумма исходных отображённых процентов = 84%.
//
// Нормализуем до 100%.
// tracks_count — демонстрационные значения.

export const genreAuraAlya: GenreAuraResponse =
  normalizeGenres([
    {
      genre_id: "pop",
      name: "Поп",
      percent: 22,
      tracks_count: 283,
    },
    {
      genre_id: "rap",
      name: "Рэп",
      percent: 15,
      tracks_count: 196,
    },
    {
      genre_id: "russian_rap",
      name: "Русский рэп",
      percent: 15,
      tracks_count: 196,
    },
    {
      genre_id: "foreign_rap",
      name: "Зарубежный рэп",
      percent: 9,
      tracks_count: 120,
    },
    {
      genre_id: "rnb",
      name: "R&B",
      percent: 9,
      tracks_count: 120,
    },
    {
      genre_id: "electronic",
      name: "Электроника",
      percent: 5,
      tracks_count: 65,
    },
    {
      genre_id: "russian_pop",
      name: "Русский поп",
      percent: 5,
      tracks_count: 55,
    },
    {
      genre_id: "soul",
      name: "Соул",
      percent: 4,
      tracks_count: 55,
    },
  ]);


// ========================================
// ТОП АРТИСТОВ — АЛЯ
// ========================================

export const topArtistsAlya: TopArtistsResponse = {
  items: [
    {
      artist_id: "drake",
      name: "Drake",
      tracks_count: 64,
      image_url:
        "https://avatars.yandex.net/get-music-content/16485602/31add165.p.39273/600x600",
    },
    {
      artist_id: "weeknd",
      name: "The Weeknd",
      tracks_count: 48,
      image_url:
        "https://avatars.yandex.net/get-music-content/16616584/b39a83e7.p.611169/600x600",
    },
    {
      artist_id: "rihanna",
      name: "Rihanna",
      tracks_count: 47,
      image_url:
        "https://avatars.yandex.net/get-music-content/95061/984409bc.p.3477/600x600",
    },
  ],
};