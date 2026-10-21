export const genreColors: Record<string, string> = {
    rap: "#8588FA",
    pop: "#B94EEB",
    foreign_rap: "#FF4F89",
    electronic: "#2ED4BD",
    indie: "#F4BD35",
    russian_rap: "#5185FA",
    rock: "#C968D8",
    local_indie: "#FF9369",

    russian_pop: "#FF6FB5",
    russian_rock: "#4169E1",
    latin_music: "#FF7847",

    rnb: "#E9AF20",
    soul: "#FFAA70",
};

// Возвращает цвет музыкального жанра.
// Для известных жанров используются заданные цвета.
// Для неизвестных — автоматически вычисляемый цвет.

export function getGenreColor(genreId: string): string {
  const knownColor = genreColors[genreId];

  if (knownColor) {
    return knownColor;
  }

  // Создаём числовой хеш из идентификатора жанра.
  let hash = 0;

  for (let i = 0; i < genreId.length; i++) {
    hash = (hash * 31 + genreId.charCodeAt(i)) >>> 0;
  }

  // Выбираем оттенок на цветовом круге.
  const hue = hash % 360;

  // Преобразуем HSL в HEX, который использует Canvas.
  const saturation = 0.7;
  const lightness = 0.62;

  const a =
    saturation * Math.min(lightness, 1 - lightness);

  function channel(n: number): number {
    const k = (n + hue / 30) % 12;

    const color =
      lightness -
      a * Math.max(
        -1,
        Math.min(k - 3, 9 - k, 1)
      );

    return Math.round(255 * color);
  }

  const toHex = (value: number) =>
    value.toString(16).padStart(2, "0");

  return `#${toHex(channel(0))}${toHex(channel(8))}${toHex(channel(4))}`;
}