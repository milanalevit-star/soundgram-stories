// Детерминированное число от 0 до 1
function hash(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

// Плавный переход между двумя числами
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Сглаживание перехода
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

// Плавный двумерный шум
export function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);

  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);

  return lerp(
    lerp(a, b, fx),
    lerp(c, d, fx),
    fy
  );
}