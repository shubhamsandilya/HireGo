import { NoProfile } from "../assets";

/**
 * Avatar wrapped in a circular progress ring that fills to `percent` and
 * glows in a colour that reflects how complete the profile is.
 */
const ProfileRing = ({
  src,
  alt = "profile",
  percent = 0,
  size = 120,
  stroke = 7,
  showBadge = true,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Warm → brand blue → green as the profile fills up.
  const color =
    clamped >= 80 ? "#16a34a" : clamped >= 50 ? "#2563eb" : "#f59e0b";

  // Leave room inside the ring so the photo doesn't touch the stroke.
  const inset = stroke + 4;
  const imgSize = size - inset * 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
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
            filter: `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 10px ${color}66)`,
          }}
        />
      </svg>

      <img
        src={src || NoProfile}
        alt={alt}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = NoProfile;
        }}
        className="absolute rounded-full object-cover ring-1 ring-black/5"
        style={{
          width: imgSize,
          height: imgSize,
          top: inset,
          left: inset,
        }}
      />

      {showBadge && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: color }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
};

export default ProfileRing;
