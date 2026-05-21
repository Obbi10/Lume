interface Props {
  size?: number;
  showText?: boolean;
  horizontal?: boolean;
  className?: string;
  textClassName?: string;
}

export default function LumeLogo({ size = 40, showText = true, horizontal = false, className = '', textClassName = '' }: Props) {
  return (
    <div className={`flex ${horizontal ? 'flex-row items-center gap-2' : 'flex-col items-center'} ${className}`}>
      <svg
        viewBox="0 0 90 65"
        width={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent"
      >
        {/* Center ray */}
        <line x1="45" y1="15" x2="45" y2="2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        {/* Left ray */}
        <line x1="17" y1="27" x2="7" y2="17" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        {/* Right ray */}
        <line x1="73" y1="27" x2="83" y2="17" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        {/* Semicircle — opens upward */}
        <path d="M 10 55 A 35 35 0 0 1 80 55" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </svg>
      {showText && (
        <span className={`text-accent font-bold tracking-tight leading-none ${textClassName}`}>
          lume
        </span>
      )}
    </div>
  );
}
