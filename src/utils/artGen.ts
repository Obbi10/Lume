const PALETTES = [
  ['#38bdf8', '#818cf8', '#0f172a'],
  ['#22d3ee', '#06b6d4', '#164e63'],
  ['#a78bfa', '#38bdf8', '#1e1b4b'],
  ['#34d399', '#38bdf8', '#064e3b'],
  ['#f472b6', '#818cf8', '#1e1b4b'],
  ['#fb923c', '#fbbf24', '#7c2d12'],
  ['#38bdf8', '#0ea5e9', '#082f49'],
  ['#e879f9', '#a78bfa', '#2e1065'],
  ['#4ade80', '#22d3ee', '#052e16'],
  ['#f87171', '#fb923c', '#450a0a'],
];

export function generateArtColors(seed: number): string[] {
  const palette = PALETTES[seed % PALETTES.length];
  return palette;
}

export function generateArtSeed(): number {
  return Math.floor(Math.random() * 1000);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function drawAbstractArt(
  canvas: HTMLCanvasElement,
  seed: number,
  colors: string[],
  size: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  const rand = seededRandom(seed);
  const [c1, c2, c3] = colors;

  // Background
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, c3);
  bg.addColorStop(1, '#08090e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Shapes
  const shapeCount = 6 + Math.floor(rand() * 6);

  for (let i = 0; i < shapeCount; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * 0.1 + rand() * size * 0.35;
    const alpha = 0.15 + rand() * 0.5;
    const color = rand() > 0.5 ? c1 : c2;
    const shapeType = Math.floor(rand() * 3);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (shapeType === 0) {
      // Circle
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (shapeType === 1) {
      // Rotated rectangle
      ctx.translate(x, y);
      ctx.rotate(rand() * Math.PI);
      ctx.fillStyle = color;
      ctx.fillRect(-r / 2, -r / 6, r, r / 3);
    } else {
      // Triangle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - r / 2);
      ctx.lineTo(x + r / 2, y + r / 2);
      ctx.lineTo(x - r / 2, y + r / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // Overlay noise lines
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = c1;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 12; i++) {
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      rand() * size, rand() * size,
      rand() * size, rand() * size,
      size, rand() * size
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
