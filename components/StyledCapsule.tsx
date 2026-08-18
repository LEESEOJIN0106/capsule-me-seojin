import type { CapsuleShape, CapsuleStyle } from "@/lib/capsule-style";

function WeatherFx({ shape, accent }: { shape: CapsuleShape; accent: string }) {
  if (shape === "rain" || shape === "storm") {
    return (
      <span className="capsule-fx capsule-fx-rain" aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} style={{ animationDelay: `${index * 0.18}s` }} />
        ))}
      </span>
    );
  }

  if (shape === "snow") {
    return (
      <span className="capsule-fx capsule-fx-snow" aria-hidden>
        {Array.from({ length: 7 }, (_, index) => (
          <i key={index} style={{ animationDelay: `${index * 0.22}s` }} />
        ))}
      </span>
    );
  }

  if (shape === "sun") {
    return (
      <span
        className="capsule-fx capsule-fx-sun"
        style={{ color: accent }}
        aria-hidden
      />
    );
  }

  if (shape === "wind") {
    return <span className="capsule-fx capsule-fx-wind" aria-hidden />;
  }

  return null;
}

function shapePath(shape: CapsuleShape) {
  switch (shape) {
    case "sun":
      return "M50 18c17.7 0 32 14.3 32 32S67.7 82 50 82 18 67.7 18 50s14.3-32 32-32z";
    case "cloud":
      return "M28 68c-8 0-14-6-14-14 0-7 5-13 12-14 2-10 11-18 22-18 10 0 19 6 22 15 8 1 14 8 14 16 0 9-7 16-16 16H28z";
    case "rain":
      return "M50 16c16 18 28 32 28 46 0 15.5-12.5 28-28 28S22 77.5 22 62c0-14 12-28 28-46z";
    case "snow":
      return "M50 14 64 28l14 8-8 14 8 14-14 8-14 14-14-14-14-8 8-14-8-14 14-8z";
    case "wind":
      return "M18 42c8-16 28-24 46-16 12 5 22 16 22 28 0 16-16 28-36 28-18 0-32-9-36-22 8 2 16 2 24-1-14-2-22-8-20-17z";
    case "storm":
      return "M22 38c2-16 18-26 36-22 14 3 24 16 22 30-8 2-8 6-2 10l-16 28-8-16c-18 2-34-10-32-30z";
    case "mist":
      return "M24 34c10-14 42-14 52 0 8 10 8 24 0 34-10 14-42 14-52 0-8-10-8-24 0-34z";
    default:
      return "M38 16h24c4 0 8 4 8 8v8H30v-8c0-4 4-8 8-8zm-10 18h44c5 0 9 4 9 9v33c0 14-12 26-26 26H45C31 102 19 90 19 76V43c0-5 4-9 9-9z";
  }
}

export function StyledCapsule({
  style,
  size = "md",
}: {
  style: CapsuleStyle;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? 72 : size === "lg" ? 168 : 120;
  const gradientId = `capsule-fill-${style.shape}-${style.primary.replace("#", "")}`;

  return (
    <div
      className="relative mx-auto"
      style={{ width: px, height: px }}
      aria-hidden
    >
      <WeatherFx shape={style.shape} accent={style.accent} />
      <svg
        viewBox="0 0 100 110"
        width={px}
        height={px}
        className="relative z-[1] drop-shadow-lg"
      >
        <defs>
          <linearGradient id={gradientId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={style.accent} />
            <stop offset="45%" stopColor={style.primary} />
            <stop offset="100%" stopColor={style.secondary} />
          </linearGradient>
        </defs>
        <path
          d={shapePath(style.shape)}
          fill={`url(#${gradientId})`}
          stroke={style.secondary}
          strokeWidth="1.4"
        />
        <ellipse
          cx="38"
          cy="36"
          rx="10"
          ry="16"
          fill={style.accent}
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
