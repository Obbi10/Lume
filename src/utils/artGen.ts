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
  ['#c084fc', '#e879f9', '#1a0533'],
  ['#67e8f9', '#38bdf8', '#083344'],
  ['#86efac', '#4ade80', '#052e16'],
  ['#fda4af', '#f472b6', '#4c0519'],
  ['#fdba74', '#fb923c', '#431407'],
  ['#a3e635', '#22d3ee', '#1a2e05'],
  ['#f0abfc', '#c084fc', '#2e0040'],
  ['#7dd3fc', '#38bdf8', '#0c1c35'],
  ['#6ee7b7', '#34d399', '#022c22'],
  ['#fcd34d', '#fb923c', '#451a03'],
  ['#c7d2fe', '#818cf8', '#1e1b4b'],
  ['#99f6e4', '#2dd4bf', '#042f2e'],
  ['#d8b4fe', '#a78bfa', '#2e1065'],
  ['#fed7aa', '#fb923c', '#431407'],
];

const NUM_STYLES = 7;

export function generateArtColors(seed: number): string[] {
  return PALETTES[seed % PALETTES.length];
}

export function generateArtSeed(): number {
  return Math.floor(Math.random() * (PALETTES.length * NUM_STYLES * 10));
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
  const style = Math.floor((seed / PALETTES.length)) % NUM_STYLES;

  // Background gradient — direction varies by seed
  const bgAngle = rand() * Math.PI * 2;
  const bgX2 = size * Math.cos(bgAngle);
  const bgY2 = size * Math.sin(bgAngle);
  const bg = ctx.createLinearGradient(0, 0, bgX2, bgY2);
  bg.addColorStop(0, c3);
  bg.addColorStop(0.6, c3 + 'cc');
  bg.addColorStop(1, '#08090e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  if (style === 0) {
    // Radial orbs — soft glowing circles
    const count = 5 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = size * 0.15 + rand() * size * 0.4;
      const color = rand() > 0.5 ? c1 : c2;
      ctx.save();
      ctx.globalAlpha = 0.2 + rand() * 0.45;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  } else if (style === 1) {
    // Crystalline — intersecting thin polygons
    const count = 8 + Math.floor(rand() * 8);
    for (let i = 0; i < count; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const r = size * 0.08 + rand() * size * 0.25;
      const sides = 3 + Math.floor(rand() * 4);
      const rot = rand() * Math.PI * 2;
      ctx.save();
      ctx.globalAlpha = 0.12 + rand() * 0.35;
      ctx.strokeStyle = rand() > 0.5 ? c1 : c2;
      ctx.fillStyle = rand() > 0.6 ? c1 + '33' : 'transparent';
      ctx.lineWidth = 0.5 + rand() * 1.5;
      ctx.beginPath();
      for (let s = 0; s <= sides; s++) {
        const angle = rot + (s / sides) * Math.PI * 2;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

  } else if (style === 2) {
    // Wave flows — layered bezier ribbons
    const waveCount = 6 + Math.floor(rand() * 6);
    for (let i = 0; i < waveCount; i++) {
      const y = (i / waveCount) * size * 1.2 - size * 0.1;
      const amp = size * 0.05 + rand() * size * 0.15;
      const color = rand() > 0.5 ? c1 : c2;
      ctx.save();
      ctx.globalAlpha = 0.08 + rand() * 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 + rand() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        size * 0.25, y + amp * (rand() * 2 - 1),
        size * 0.5, y + amp * (rand() * 2 - 1),
        size * 0.75, y + amp * (rand() * 2 - 1)
      );
      ctx.bezierCurveTo(
        size * 0.85, y + amp * (rand() * 2 - 1),
        size * 0.95, y + amp * (rand() * 2 - 1),
        size, y
      );
      ctx.stroke();
      ctx.restore();
    }
    // Add some orbs on top
    for (let i = 0; i < 4; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = size * 0.1 + rand() * size * 0.2;
      ctx.save();
      ctx.globalAlpha = 0.15 + rand() * 0.25;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rand() > 0.5 ? c1 : c2);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  } else if (style === 3) {
    // Mosaic — grid of varying opacity squares
    const cols = 4 + Math.floor(rand() * 4);
    const cell = size / cols;
    for (let row = 0; row < cols; row++) {
      for (let col = 0; col < cols; col++) {
        if (rand() > 0.45) continue;
        const color = rand() > 0.5 ? c1 : c2;
        ctx.save();
        ctx.globalAlpha = 0.08 + rand() * 0.4;
        ctx.fillStyle = color;
        const gap = cell * 0.06;
        ctx.fillRect(col * cell + gap, row * cell + gap, cell - gap * 2, cell - gap * 2);
        ctx.restore();
      }
    }
    // Overlay a central glow
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.6);
    g.addColorStop(0, c1 + '44');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

  } else if (style === 4) {
    // Constellation — dots connected by thin lines
    const dots: [number, number][] = [];
    const dotCount = 8 + Math.floor(rand() * 10);
    for (let i = 0; i < dotCount; i++) {
      dots.push([rand() * size, rand() * size]);
    }
    // Lines between nearby dots
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i][0] - dots[j][0];
        const dy = dots[i][1] - dots[j][1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < size * 0.45) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / (size * 0.45)) * 0.4;
          ctx.strokeStyle = rand() > 0.5 ? c1 : c2;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(dots[i][0], dots[i][1]);
          ctx.lineTo(dots[j][0], dots[j][1]);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    // Draw dots
    dots.forEach(([x, y]) => {
      const r = 1 + rand() * 3;
      ctx.save();
      ctx.globalAlpha = 0.4 + rand() * 0.6;
      ctx.fillStyle = rand() > 0.5 ? c1 : c2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

  } else if (style === 5) {
    // Concentric rings — offset from a random centre
    const cx = size * 0.2 + rand() * size * 0.6;
    const cy = size * 0.2 + rand() * size * 0.6;
    const ringCount = 5 + Math.floor(rand() * 7);
    for (let i = ringCount; i >= 0; i--) {
      const r = (i / ringCount) * size * 0.75;
      ctx.save();
      ctx.globalAlpha = 0.06 + (i / ringCount) * 0.25;
      ctx.strokeStyle = i % 2 === 0 ? c1 : c2;
      ctx.lineWidth = 1 + rand() * 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Central fill
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.3);
    g.addColorStop(0, c1 + '55');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

  } else {
    // Diagonal slabs — overlapping tilted rectangles
    const slabCount = 6 + Math.floor(rand() * 6);
    for (let i = 0; i < slabCount; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = size * 0.3 + rand() * size * 0.5;
      const h = size * 0.04 + rand() * size * 0.12;
      const rot = (rand() - 0.5) * Math.PI * 0.6;
      const color = rand() > 0.5 ? c1 : c2;
      ctx.save();
      ctx.globalAlpha = 0.1 + rand() * 0.35;
      ctx.translate(x, y);
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.3, color);
      g.addColorStop(0.7, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }

  // Subtle vignette
  const vig = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.85);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, size, size);
}
