/**
 * Circular gauge that shows a 0-100 score in its centre and glows in a colour
 * that reflects the score band (amber → blue → green).
 */
const ScoreGauge = ({ score = 0, size = 120, stroke = 9, label }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 75 ? "#16a34a" : clamped >= 50 ? "#2563eb" : "#f59e0b";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.9s ease, stroke 0.4s ease",
            filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 9px ${color}55)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.26 }}>
          {clamped}
          <span style={{ fontSize: size * 0.13 }}>%</span>
        </span>
        {label && (
          <span className="mt-0.5 text-[10px] font-medium text-slate-500">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreGauge;
