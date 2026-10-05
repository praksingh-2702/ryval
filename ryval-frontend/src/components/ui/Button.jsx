const VARIANTS = {
  primary: "bg-royal text-white",
  accent: "bg-lemon text-ink",
  plain: "bg-card text-ink",
};

const SIZES = {
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-4 font-display text-3xl font-extrabold",
  xl: "px-8 py-6 font-display text-5xl font-extrabold",
};

/**
 * Pressable block. Hover lifts it, press pushes it flat into its shadow.
 * Use `as={Link}` (or any element) to render something other than <button>.
 */
export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  type,
  ...props
}) {
  const typeProp = Tag === "button" ? { type: type ?? "button" } : {};
  return (
    <Tag
      {...typeProp}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-xl border-2 border-ink font-semibold shadow-hard transition-[translate,box-shadow] duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
