import { useEffect, useRef } from 'react';
import { drawAbstractArt } from '../utils/artGen';

interface Props {
  seed: number;
  colors: string[];
  size?: number;
  className?: string;
}

export default function AbstractAvatar({ seed, colors, size = 40, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawAbstractArt(canvasRef.current, seed, colors, size * 2);
    }
  }, [seed, colors, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size * 2}
      height={size * 2}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
