"use client";

import type { MascotId } from "../lib/product";

type Mood = "idle" | "hello" | "thinking" | "celebrate";

const palettes = {
  cat: { fur: "#f3eee8", patch: "#9b7b68", ear: "#d8aca5", accent: "#74584c" },
  dog: { fur: "#d8d4cf", patch: "#6f6c69", ear: "#8e8a86", accent: "#4c4947" },
  rabbit: { fur: "#f4eee9", patch: "#c7b6aa", ear: "#e8b8bd", accent: "#7e6963" },
  fox: { fur: "#fffaf1", patch: "#d9dde2", ear: "#d9b2af", accent: "#68707a" },
} as const;

export default function Mascot({
  id,
  mood = "idle",
  size = 88,
  label,
}: {
  id: MascotId;
  mood?: Mood;
  size?: number;
  label?: string;
}) {
  if (id === "none") return null;
  const p = palettes[id];
  const transform =
    mood === "thinking"
      ? "rotate(-3 60 60)"
      : mood === "celebrate"
        ? "rotate(2 60 60)"
        : "rotate(0 60 60)";

  return (
    <svg
      className={`mascotSvg mascot-${id} mood-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g transform={transform}>
        {id === "rabbit" && (
          <>
            <ellipse cx="43" cy="24" rx="13" ry="30" fill={p.fur} stroke={p.accent} strokeWidth="3" />
            <ellipse cx="77" cy="24" rx="13" ry="30" fill={p.fur} stroke={p.accent} strokeWidth="3" />
            <ellipse cx="43" cy="24" rx="5" ry="20" fill={p.ear} opacity=".72" />
            <ellipse cx="77" cy="24" rx="5" ry="20" fill={p.ear} opacity=".72" />
          </>
        )}
        {id !== "rabbit" && (
          <>
            <path
              d={id === "fox" ? "M22 45 31 15 51 35Z" : "M24 43 33 18 51 37Z"}
              fill={p.fur}
              stroke={p.accent}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d={id === "fox" ? "M98 45 89 15 69 35Z" : "M96 43 87 18 69 37Z"}
              fill={p.fur}
              stroke={p.accent}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M31 24 38 37 45 35Z" fill={p.ear} opacity=".72" />
            <path d="M89 24 82 37 75 35Z" fill={p.ear} opacity=".72" />
          </>
        )}

        <path
          d={id === "dog"
            ? "M25 58c0-25 15-38 35-38s35 13 35 38v13c0 22-14 35-35 35S25 93 25 71Z"
            : "M22 61c0-27 17-42 38-42s38 15 38 42v12c0 21-15 34-38 34S22 94 22 73Z"}
          fill={p.fur}
          stroke={p.accent}
          strokeWidth="3"
        />

        {id === "cat" && (
          <>
            <path d="M29 55c12-14 21-20 34-20 15 0 24 8 30 18-9-2-16-1-23 4-13-8-25-8-41-2Z" fill={p.patch} opacity=".86" />
            <path d="M36 79c-8 1-13 4-19 8M37 86c-9 2-15 6-20 11M83 79c8 1 13 4 19 8M83 86c9 2 15 6 20 11" stroke={p.accent} strokeWidth="2" strokeLinecap="round" opacity=".65" />
          </>
        )}

        {id === "dog" && (
          <>
            <path d="M31 35c-12 3-17 18-10 31 4 7 10 8 16 4l6-31Z" fill={p.patch} stroke={p.accent} strokeWidth="3" />
            <path d="M89 35c12 3 17 18 10 31-4 7-10 8-16 4l-6-31Z" fill={p.patch} stroke={p.accent} strokeWidth="3" />
            <path d="M41 77c5 15 33 15 38 0-7 4-11 5-19 5s-12-1-19-5Z" fill={p.patch} opacity=".95" />
            <path d="M42 85c4 12 9 17 18 17s14-5 18-17c-11 6-25 6-36 0Z" fill={p.patch} opacity=".72" />
          </>
        )}

        {id === "rabbit" && (
          <>
            <path d="M28 48c9-13 21-20 32-20 12 0 24 7 32 20-10-3-18-3-28 3-12-6-22-6-36-3Z" fill={p.patch} opacity=".45" />
            <circle cx="27" cy="69" r="9" fill={p.fur} opacity=".86" />
            <circle cx="93" cy="69" r="9" fill={p.fur} opacity=".86" />
          </>
        )}

        {id === "fox" && (
          <>
            <path d="M28 48c10-11 20-15 32-15 13 0 24 5 33 16-14-1-25 4-33 14-9-10-19-15-32-15Z" fill={p.patch} opacity=".55" />
            <path d="M45 86c4 10 10 15 15 15s11-5 15-15c-10 5-20 5-30 0Z" fill="#ffffff" opacity=".92" />
          </>
        )}

        <circle cx="46" cy="67" r="4.5" fill={p.accent} />
        <circle cx="74" cy="67" r="4.5" fill={p.accent} />
        <circle cx="44.5" cy="65.5" r="1.3" fill="#fff" />
        <circle cx="72.5" cy="65.5" r="1.3" fill="#fff" />

        <path
          d={id === "dog" ? "M54 78c4-4 8-4 12 0-1 5-3 7-6 7s-5-2-6-7Z" : "M55 79c3-3 7-3 10 0-1 4-3 6-5 6s-4-2-5-6Z"}
          fill={p.accent}
        />

        {mood === "thinking" ? (
          <path d="M52 91c5-2 11-2 16 0" fill="none" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <path d="M52 89c4 6 12 6 16 0" fill="none" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" />
        )}

        {mood === "celebrate" && (
          <>
            <path d="M18 30 12 22M102 30l6-8M22 98l-9 5M98 98l9 5" stroke="#f1ad4e" strokeWidth="3" strokeLinecap="round" />
            <circle cx="14" cy="41" r="3" fill="#79a98c" />
            <circle cx="106" cy="43" r="3" fill="#ef746b" />
          </>
        )}
      </g>
    </svg>
  );
}
