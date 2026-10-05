import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../lib/queries";
import Avatar from "./avatar/Avatar";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleLogout() {
    logout();
    // Drop cached profile/leaderboard so the next account never sees them.
    queryClient.clear();
    navigate("/login");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-xl border-2 border-ink bg-card py-1.5 pl-1.5 pr-4 shadow-hard-sm transition-[translate,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-hard active:translate-y-0.5 active:shadow-none"
      >
        <Avatar avatar={profile?.avatar} size={36} />
        <span className="hidden max-w-32 truncate font-semibold sm:block">{user?.username}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-3 w-56 overflow-hidden rounded-xl border-2 border-ink bg-card shadow-hard"
        >
          <Link
            to="/customize"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-b-2 border-ink px-4 py-3 font-semibold hover:bg-lemon"
          >
            Edit your sigil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-4 py-3 text-left font-semibold hover:bg-lemon"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
