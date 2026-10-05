import { Link } from "react-router-dom";

export default function Wordmark({ to = "/dashboard", className = "" }) {
  return (
    <Link
      to={to}
      className={`font-display text-4xl font-black leading-none tracking-tight ${className}`}
    >
      RYVAL
    </Link>
  );
}
