import { DEFAULT_COLOR, hsvToHex, normalizeHex } from "../../lib/color";

// Sigil parts. Everything is drawn on one 64 x 64 grid.
// The KEYS here must match ryval-backend AvatarCatalog exactly: the backend
// stores keys (never indexes), so parts can be reordered or added freely.

export const SHAPES = {
  round: {
    label: "Round",
    d: "M10 32A22 22 0 0 1 54 32A22 22 0 0 1 10 32Z",
  },
  hex: {
    label: "Hex",
    d: "M32 8L53 20V44L32 56L11 44V20Z",
  },
  shield: {
    label: "Shield",
    d: "M12 12H52V33C52 45 43 53 32 58C21 53 12 45 12 33Z",
  },
  diamond: {
    label: "Diamond",
    d: "M32 7L57 32L32 57L7 32Z",
  },
  wedge: {
    label: "Wedge",
    d: "M10 14H54L32 57Z",
  },
  capsule: {
    label: "Capsule",
    d: "M17 24A15 15 0 0 1 47 24V40A15 15 0 0 1 17 40Z",
  },
  block: {
    label: "Block",
    d: "M25 11H39A14 14 0 0 1 53 25V39A14 14 0 0 1 39 53H25A14 14 0 0 1 11 39V25A14 14 0 0 1 25 11Z",
  },
  crown: {
    label: "Crown",
    d: "M12 20H24L32 11L40 20H52V44L40 54H24L12 44Z",
  },
};

const stroke = (c, w) => ({
  fill: "none",
  stroke: c,
  strokeWidth: w,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const EYES = {
  dot: {
    label: "Dots",
    Art: ({ c }) => (
      <>
        <circle cx="24" cy="28" r="3.4" fill={c} />
        <circle cx="40" cy="28" r="3.4" fill={c} />
      </>
    ),
  },
  slit: {
    label: "Slits",
    Art: ({ c }) => (
      <>
        <rect x="19" y="26.3" width="10" height="3.4" rx="1.7" fill={c} />
        <rect x="35" y="26.3" width="10" height="3.4" rx="1.7" fill={c} />
      </>
    ),
  },
  fierce: {
    label: "Fierce",
    Art: ({ c }) => (
      <>
        <path d="M19 24L29 29" {...stroke(c, 3.2)} />
        <path d="M45 24L35 29" {...stroke(c, 3.2)} />
      </>
    ),
  },
  wide: {
    label: "Wide",
    Art: ({ c }) => (
      <>
        <circle cx="24" cy="28" r="5" {...stroke(c, 2.4)} />
        <circle cx="24" cy="28" r="1.8" fill={c} />
        <circle cx="40" cy="28" r="5" {...stroke(c, 2.4)} />
        <circle cx="40" cy="28" r="1.8" fill={c} />
      </>
    ),
  },
  visor: {
    label: "Visor",
    Art: ({ c }) => <rect x="18" y="24.5" width="28" height="7" rx="3.5" fill={c} />,
  },
  chevron: {
    label: "Chevrons",
    Art: ({ c }) => (
      <>
        <path d="M21 24L27 28L21 32" {...stroke(c, 2.8)} />
        <path d="M43 24L37 28L43 32" {...stroke(c, 2.8)} />
      </>
    ),
  },
  cross: {
    label: "Crosses",
    Art: ({ c }) => (
      <path
        d="M20.5 24.5L27.5 31.5M27.5 24.5L20.5 31.5M36.5 24.5L43.5 31.5M43.5 24.5L36.5 31.5"
        {...stroke(c, 2.8)}
      />
    ),
  },
  cyclops: {
    label: "Cyclops",
    Art: ({ c }) => (
      <>
        <circle cx="32" cy="28" r="6" {...stroke(c, 2.6)} />
        <circle cx="32" cy="28" r="2.2" fill={c} />
      </>
    ),
  },
};

export const MARKS = {
  smile: {
    label: "Smile",
    Art: ({ c }) => <path d="M24 42Q32 49 40 42" {...stroke(c, 2.8)} />,
  },
  fangs: {
    label: "Fangs",
    Art: ({ c }) => (
      <>
        <path d="M24 40H40" {...stroke(c, 2.6)} />
        <path d="M27 40L29.5 46L32 40ZM32 40L34.5 46L37 40Z" fill={c} />
      </>
    ),
  },
  scar: {
    label: "Scar",
    Art: ({ c }) => (
      <path d="M40 13L46 26M38 18.5L45 16.5M39.5 22L46 20" {...stroke(c, 2.4)} />
    ),
  },
  warpaint: {
    label: "War paint",
    Art: ({ c }) => <path d="M21 34V41M27 34V41M37 34V41M43 34V41" {...stroke(c, 2.4)} />,
  },
  dots: {
    label: "Dots",
    Art: ({ c }) => (
      <>
        <circle cx="26" cy="17" r="1.9" fill={c} />
        <circle cx="32" cy="15" r="1.9" fill={c} />
        <circle cx="38" cy="17" r="1.9" fill={c} />
      </>
    ),
  },
  plus: {
    label: "Plus",
    Art: ({ c }) => <path d="M32 12V22M27 17H37" {...stroke(c, 2.8)} />,
  },
  grille: {
    label: "Grille",
    Art: ({ c }) => (
      <>
        <rect x="22" y="40" width="20" height="8" rx="2" {...stroke(c, 2.2)} />
        <path d="M27 40V48M32 40V48M37 40V48" {...stroke(c, 2)} />
      </>
    ),
  },
  gem: {
    label: "Gem",
    Art: ({ c }) => <path d="M32 11L36.5 17L32 23L27.5 17Z" fill={c} />,
  },
};

export const DEFAULT_AVATAR = {
  shape: "round",
  eyes: "dot",
  mark: "smile",
  color: DEFAULT_COLOR,
};

// Anything missing or unknown (an old key, a bad color) falls back to a
// known-good value, so a stale record can never break rendering.
const has = (obj, key) => typeof key === "string" && Object.hasOwn(obj, key);

export function normalizeAvatar(a) {
  return {
    shape: has(SHAPES, a?.shape) ? a.shape : DEFAULT_AVATAR.shape,
    eyes: has(EYES, a?.eyes) ? a.eyes : DEFAULT_AVATAR.eyes,
    mark: has(MARKS, a?.mark) ? a.mark : DEFAULT_AVATAR.mark,
    color: normalizeHex(a?.color) ?? DEFAULT_AVATAR.color,
  };
}

const pick = (obj) => {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
};

export function randomAvatar() {
  return {
    shape: pick(SHAPES),
    eyes: pick(EYES),
    mark: pick(MARKS),
    color: hsvToHex({ h: Math.random() * 360, s: 0.7 + Math.random() * 0.25, v: 0.9 + Math.random() * 0.1 }),
  };
}
