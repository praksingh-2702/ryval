import { useRef, useState } from "react";
import { hexToHsv, hsvToHex, normalizeHex } from "../../lib/color";

/**
 * Full-spectrum color picker: hue around the wheel, saturation by distance
 * from the center, brightness on the slider below. Controlled by `value`
 * (a "#RRGGBB" string) and reports changes through `onChange(hex)`.
 *
 * HSV is kept locally while dragging so greys and blacks don't lose their
 * hue (a hex string can't remember it). If `value` changes from outside,
 * for example Shuffle, the local HSV is re-derived from it.
 */
export default function ColorWheel({ value, onChange, size = 208 }) {
  const wheelRef = useRef(null);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [lastValue, setLastValue] = useState(value);
  const [hexDraft, setHexDraft] = useState(normalizeHex(value) ?? value);

  // Sync from the outside during render (React's recommended pattern for
  // deriving state from props) instead of an effect.
  if (value !== lastValue) {
    setLastValue(value);
    const incoming = normalizeHex(value);
    if (incoming && incoming !== hsvToHex(hsv)) setHsv(hexToHsv(incoming));
    if (incoming) setHexDraft(incoming);
  }

  function commit(next) {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexDraft(hex);
    onChange(hex);
  }

  function pickFromPointer(e) {
    const rect = wheelRef.current.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = e.clientX - (rect.left + radius);
    const dy = e.clientY - (rect.top + radius);
    const s = Math.min(1, Math.hypot(dx, dy) / radius);
    // Clockwise angle from the top, matching the conic-gradient below.
    let h = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (h < 0) h += 360;
    commit({ h, s, v: hsv.v });
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pickFromPointer(e);
  }

  function onPointerMove(e) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) pickFromPointer(e);
  }

  function onHexChange(e) {
    const raw = e.target.value;
    setHexDraft(raw);
    const parsed = normalizeHex(raw);
    if (parsed) {
      setHsv(hexToHsv(parsed));
      onChange(parsed);
    }
  }

  function onHexBlur() {
    setHexDraft(hsvToHex(hsv));
  }

  const R = size / 2;
  const angle = (hsv.h * Math.PI) / 180;
  const thumbX = R + Math.sin(angle) * hsv.s * R;
  const thumbY = R - Math.cos(angle) * hsv.s * R;
  const current = hsvToHex(hsv);

  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
      <div
        ref={wheelRef}
        role="group"
        aria-label="Color wheel. Drag to pick a hue and saturation."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        className="relative shrink-0 cursor-crosshair touch-none rounded-full border-2 border-ink shadow-hard-sm"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle closest-side, #fff, rgba(255,255,255,0)), conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-black"
          style={{ opacity: 1 - hsv.v }}
        />
        <div
          className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink shadow-hard-sm"
          style={{ left: thumbX, top: thumbY, background: current }}
        />
      </div>

      <div className="w-full max-w-xs space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Brightness</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(hsv.v * 100)}
            onChange={(e) => commit({ ...hsv, v: Number(e.target.value) / 100 })}
            className="slider w-full"
            style={{
              background: `linear-gradient(to right, #000, ${hsvToHex({ h: hsv.h, s: hsv.s, v: 1 })})`,
            }}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Hex code</span>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-11 w-11 shrink-0 rounded-lg border-2 border-ink"
              style={{ background: current }}
            />
            <input
              value={hexDraft}
              onChange={onHexChange}
              onBlur={onHexBlur}
              maxLength={7}
              spellCheck={false}
              autoCapitalize="characters"
              className="w-full rounded-lg border-2 border-ink bg-card px-4 py-2.5 text-base font-semibold uppercase tabular-nums outline-none transition-[translate,box-shadow] duration-150 focus:-translate-y-0.5 focus:shadow-hard-sm"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
