import { useEffect, useRef } from "react";
import type { GenreAuraResponse } from "../mockData";
import { getGenreColor } from "../genreColors";
import { noise2D } from "../auraNoise";

const WIDTH = 360;
const HEIGHT = 400;

type RGB = {
  r: number;
  g: number;
  b: number;
};

type AuraStream = {
  color: RGB;
  share: number;
  x: number;
  phase: number;
  seed: number;
  width: number;
  height: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string): RGB {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function hashGenre(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  return hash / 4294967295;
}

type Props = {
  genreAura: GenreAuraResponse;
};

export default function MusicAuraCanvas({ genreAura }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const genres = genreAura.items
      .filter(
        (genre) =>
          Number.isFinite(genre.share) && genre.share > 0
      )
      .sort((a, b) => b.share - a.share)
      .slice(0, 8);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (genres.length === 0) return;

    const totalShare = genres.reduce(
      (sum, genre) => sum + genre.share,
      0
    );

    // Каждый жанр создаёт собственный цветовой поток.
    const streams: AuraStream[] = genres.map((genre, index) => {
      const share = genre.share / totalShare;
      const seed = hashGenre(genre.genre_id);

      const hex = getGenreColor(genre.genre_id);

      // Размещаем потоки в разных частях ауры.
      const position = (index + 0.5) / genres.length;

      const x = (position - 0.5) * 1.2;

      return {
        color: hexToRgb(hex),
        share,
        x,
        phase: seed * Math.PI * 2,
        seed,
        width: 0.24 + Math.sqrt(share) * 0.3,
        height: 0.65 + Math.sqrt(share) * 0.5,
      };
    });

    const image = ctx.createImageData(WIDTH, HEIGHT);
    const pixels = image.data;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        // Координаты от -1 до 1.
        const nx = (x - WIDTH / 2) / (WIDTH / 2);
        const ny = (y - HEIGHT / 2) / (HEIGHT / 2);

        // Плавное искривление пространства.
        const flowX =
          (noise2D(nx * 1.7 + 11, ny * 1.7 + 23) - 0.5) *
          0.38;

        const flowY =
          (noise2D(nx * 1.5 + 41, ny * 1.5 + 53) - 0.5) *
          0.24;

        const px = nx + flowX;
        const py = ny + flowY;

        let red = 0;
        let green = 0;
        let blue = 0;

        let totalWeight = 0;
        let totalLight = 0;

        // Каждый поток изгибается по собственной траектории.
        for (const stream of streams) {
          const bend =
            Math.sin(py * 3.2 + stream.phase) * 0.17 +
            Math.sin(py * 5.5 + stream.phase * 0.7) * 0.07;

          const centerX = stream.x + bend;

          const dx = (px - centerX) / stream.width;
          const dy = (py + 0.03) / stream.height;

          // Не круг, а вытянутый плавный поток.
          const distance =
            dx * dx * 0.85 + dy * dy * 0.65;

          const field = Math.exp(-distance * 2.8);

          // Более популярный жанр создаёт более
          // выраженную область, но не скрывает остальные.
          const importance = 0.3 + Math.sqrt(stream.share);

          const weight = field * importance;

          red += stream.color.r * weight;
          green += stream.color.g * weight;
          blue += stream.color.b * weight;

          totalWeight += weight;
          totalLight += field * importance;
        }

        if (totalWeight < 0.0001) {
          continue;
        }

        // Цвет зависит от влияния отдельных жанров.
        red /= totalWeight;
        green /= totalWeight;
        blue /= totalWeight;

        // Общая форма собирается из всех потоков.
        const density = 1 - Math.exp(-totalLight * 1.1);

        // Неровные, слегка вытянутые края.
        const edgeNoise =
          (noise2D(nx * 3.8 + 71, ny * 3.8 + 83) - 0.5) *
          0.24;

        const distanceFromCenter = Math.sqrt(
          Math.pow(nx * 1.05, 2) +
          Math.pow(ny * 0.70, 2)
        );

        const silhouette = clamp(
          (1.14 - distanceFromCenter + edgeNoise) * 2.2
        );

        // Светлый центр — отдельно от цветных потоков.
        // Его располагаем немного выше середины.
        const coreX = nx / 0.34;
        const coreY = (ny + 0.22) / 0.52;

        const coreDistance =
          coreX * coreX + coreY * coreY;

        const core = Math.exp(-coreDistance * 1.7);

        // Небольшой светлый акцент без жёлтого оттенка.
        const coreStrength = core * 0.32;

        red =
          red * (1 - coreStrength) +
          255 * coreStrength;

        green =
          green * (1 - coreStrength) +
          224 * coreStrength;

        blue =
          blue * (1 - coreStrength) +
          241 * coreStrength;

        // Мягкие световые переливы внутри формы.
        const shimmer =
          noise2D(px * 7 + 101, py * 7 + 113);

        const highlight = clamp(
          (shimmer - 0.56) * 0.22
        );

        red += 255 * highlight;
        green += 220 * highlight;
        blue += 245 * highlight;

        // Прозрачность формирует края ауры.
        const alpha = clamp(
          Math.pow(density, 0.65) *
          silhouette *
          1.65
        );

        // Плавно убираем срезы у левого и правого краёв Canvas.
        // Основная ширина ауры остаётся прежней.
        const distanceToEdge = 1 - Math.abs(nx);

        // Затухание действует только на крайние 7% ширины
        // с каждой стороны.
        const edgeWidth = 0.14;
        const t = clamp(distanceToEdge / edgeWidth);

        // Плавный переход без резкой границы.
        const horizontalFade = t * t * (3 - 2 * t);

        const finalAlpha = alpha * horizontalFade;
        const index = (y * WIDTH + x) * 4;

        const boost = 1.16;

        pixels[index] = Math.round(
            clamp((red * boost) / 255) * 255
        );

        pixels[index + 1] = Math.round(
            clamp((green * boost) / 255) * 255
        );

        pixels[index + 2] = Math.round(
            clamp((blue * boost) / 255) * 255
        );

        pixels[index + 3] = Math.round(finalAlpha * 255);
      }
    }

    ctx.putImageData(image, 0, 0);

    // ========================================
// ХУДОЖЕСТВЕННОЕ ОСВЕЩЕНИЕ АУРЫ
// ========================================

// Вспомогательная функция для рисования
// вытянутого светящегося пятна.
    function drawGlow(
        x: number,
        y: number,
        width: number,
        height: number,
        color: string,
        intensity: number
    ) {
        ctx!.save();

        // Перемещаем начало координат в центр свечения.
        ctx!.translate(x, y);

        // Превращаем круговой градиент в эллиптический.
        ctx!.scale(width, height);

        const gradient = ctx!.createRadialGradient(
            0, 0, 0,
            0, 0, 1
        );

        gradient.addColorStop(
            0,
            `rgba(${color}, ${intensity})`
        );

        gradient.addColorStop(
            0.25,
            `rgba(${color}, ${intensity * 0.65})`
        );

        gradient.addColorStop(
            0.6,
            `rgba(${color}, ${intensity * 0.18})`
        );

        gradient.addColorStop(
            1,
            `rgba(${color}, 0)`
        );

        ctx!.fillStyle = gradient;

        // Координаты здесь от -1 до 1,
        // поскольку мы масштабировали контекст.
        ctx!.fillRect(-1, -1, 2, 2);

        ctx!.restore();
    }

// Светлое ядро — немного выше Kanye.
    drawGlow(
        WIDTH * 0.5,
        HEIGHT * 0.38,
        85,
        125,
        "255, 224, 239",
        0.38
    );

// Мягкий розовый свет справа.
    drawGlow(
        WIDTH * 0.7,
        HEIGHT * 0.55,
        65,
        150,
        "255, 95, 177",
        0.22
    );

// Голубовато-лиловый свет слева.
    drawGlow(
        WIDTH * 0.3,
        HEIGHT * 0.5,
        65,
        145,
        "155, 170, 255",
        0.24
    );

  }, [genreAura]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="music-aura-canvas"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}