import { Flame } from "lucide-react";

function pluralizeDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

interface StreakBadgeProps {
  streak: number;
  longestStreak: number;
}

export function StreakBadge({ streak, longestStreak }: StreakBadgeProps) {
  const isCold = streak === 0;
  const isWarm = streak >= 1 && streak < 3;
  const isHot = streak >= 3 && streak < 7;
  const isOnFire = streak >= 7;

  const color = isOnFire
    ? "#dc2626"
    : isHot
      ? "#f97316"
      : isWarm
        ? "#f59e0b"
        : "#6b7280";

  const bg = isOnFire
    ? "rgba(220, 38, 38, 0.12)"
    : isHot
      ? "rgba(249, 115, 22, 0.12)"
      : isWarm
        ? "rgba(245, 158, 11, 0.12)"
        : "rgba(107, 114, 128, 0.1)";

  const border = isOnFire
    ? "rgba(220, 38, 38, 0.3)"
    : isHot
      ? "rgba(249, 115, 22, 0.3)"
      : isWarm
        ? "rgba(245, 158, 11, 0.3)"
        : "rgba(107, 114, 128, 0.2)";

  const label = isCold ? "нет серии" : pluralizeDays(streak);

  return (
    <div
      className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-3.5 py-2"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      <Flame
        size={18}
        color={color}
        fill={!isCold ? color : "none"}
        className=""
      />
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {streak}
      </span>
      <span className="text-[11px] opacity-60">{label}</span>
      {longestStreak > 0 && longestStreak > streak && (
        <span className="ml-1 text-[10px] opacity-40">
          · рекорд {longestStreak}
        </span>
      )}
    </div>
  );
}
