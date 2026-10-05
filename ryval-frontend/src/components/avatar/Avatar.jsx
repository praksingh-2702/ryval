import { memo, useId } from "react";
import { sigilPalette, INK } from "../../lib/color";
import { EYES, MARKS, SHAPES, normalizeAvatar } from "./parts";

/**
 * Renders a player's sigil.
 *
 *   avatar  { shape, eyes, mark, color }. Pass nothing (null/undefined) while
 *           the profile is still loading and a neutral skeleton tile shows.
 *           Unknown keys or a bad color fall back to safe defaults.
 *   size    pixel size of the square tile
 *   bare    no tile or border, just the head (used inside picker buttons)
 *   shadow  hard offset shadow under the tile
 */
function Avatar({ avatar, size = 64, bare = false, shadow = false, className = "", title }) {
  // Hooks run before any early return.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  if (!avatar) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block shrink-0 rounded-[22%] border-2 border-ink bg-ink/10 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const a = normalizeAvatar(avatar);
  const pal = sigilPalette(a.color);
  const shape = SHAPES[a.shape];
  const Eyes = EYES[a.eyes].Art;
  const Mark = MARKS[a.mark].Art;

  // Outline stays a crisp, UI-matching weight at every size.
  const outline = Math.max(1.5, Math.min(3, size / 28));
  const clipId = `sigil-clip-${uid}`;

  const frame = bare
    ? ""
    : `rounded-[22%] border-2 border-ink ${shadow ? (size >= 96 ? "shadow-hard" : "shadow-hard-sm") : ""}`;

  return (
    <span
      role="img"
      aria-label={title ?? "Player sigil"}
      className={`inline-block shrink-0 overflow-hidden ${frame} ${className}`}
      style={{ width: size, height: size, background: bare ? undefined : pal.tile }}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" className="block" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <path d={shape.d} />
          </clipPath>
        </defs>

        <path d={shape.d} fill={pal.base} />

        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="43" width="64" height="21" fill={pal.shade} opacity="0.45" />
          <Eyes c={pal.on} />
          <Mark c={pal.on} />
        </g>

        <path
          d={shape.d}
          fill="none"
          stroke={INK}
          strokeWidth={outline}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}

export default memo(Avatar);
