import Avatar from "./Avatar";
import ColorWheel from "./ColorWheel";
import { EYES, MARKS, SHAPES } from "./parts";

// Each option previews itself on the player's current sigil, so what you
// see in the grid is what you get.
function PartRow({ title, field, parts, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-3 text-base font-semibold">{title}</legend>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {Object.entries(parts).map(([key, part]) => {
          const selected = value[field] === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              aria-label={part.label}
              title={part.label}
              onClick={() => onChange({ ...value, [field]: key })}
              className={`flex aspect-square items-center justify-center rounded-xl border-2 border-ink transition-[translate,box-shadow] duration-150 ${
                selected
                  ? "-translate-y-0.5 bg-lemon shadow-hard-sm"
                  : "bg-card hover:-translate-y-0.5 hover:shadow-hard-sm"
              }`}
            >
              <Avatar avatar={{ ...value, [field]: key }} size={48} bare />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function AvatarEditor({ value, onChange }) {
  return (
    <div className="space-y-8">
      <PartRow title="Head" field="shape" parts={SHAPES} value={value} onChange={onChange} />
      <PartRow title="Eyes" field="eyes" parts={EYES} value={value} onChange={onChange} />
      <PartRow title="Mark" field="mark" parts={MARKS} value={value} onChange={onChange} />
      <section>
        <h3 className="mb-3 text-base font-semibold">Color</h3>
        <ColorWheel value={value.color} onChange={(color) => onChange({ ...value, color })} />
      </section>
    </div>
  );
}
