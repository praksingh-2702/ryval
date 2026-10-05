export default function Field({ label, className = "", ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        className={`w-full rounded-lg border-2 border-ink bg-card px-4 py-3 text-base outline-none transition-[translate,box-shadow] duration-150 placeholder:text-soft/60 focus:-translate-y-0.5 focus:shadow-hard-sm ${className}`}
        {...props}
      />
    </label>
  );
}
