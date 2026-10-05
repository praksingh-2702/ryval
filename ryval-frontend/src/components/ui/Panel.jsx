export default function Panel({ as: Tag = "div", className = "", ...props }) {
  return (
    <Tag
      className={`rounded-3xl border-2 border-ink bg-card shadow-hard ${className}`}
      {...props}
    />
  );
}
