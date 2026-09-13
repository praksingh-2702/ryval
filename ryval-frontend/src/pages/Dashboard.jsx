import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Trophy, LogOut, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

function useProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
  });
}

function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => (await api.get("/leaderboard?limit=10")).data,
    refetchInterval: 15000, // keep it feeling live
  });
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-ink text-paper">
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-ink-line">
        <span className="font-display text-xl font-bold">RYVAL</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted hover:text-coral transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="font-display text-3xl font-bold mb-8">
            {user?.username || "player"}
          </h1>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="Rating"
            value={profileLoading ? "—" : profile?.rating}
            accent="violet"
          />
          <StatCard
            label="Wins"
            value={profileLoading ? "—" : profile?.wins}
            accent="gold"
          />
          <StatCard
            label="Losses"
            value={profileLoading ? "—" : profile?.losses}
            accent="coral"
          />
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-violet hover:bg-violet-dim transition-colors text-white font-semibold py-4 rounded-xl mb-12 text-base">
          <Swords size={18} />
          Find a battle
        </button>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-gold" />
            <h2 className="font-display text-lg font-semibold">Leaderboard</h2>
          </div>

          <div className="border border-ink-line rounded-xl overflow-hidden">
            {leaderboardLoading && (
              <p className="text-sm text-muted px-4 py-6 text-center">Loading…</p>
            )}
            {leaderboard?.map((entry, i) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  i !== leaderboard.length - 1 ? "border-b border-ink-line" : ""
                } ${entry.username === user?.username ? "bg-violet/10" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold text-muted w-5">
                    {entry.rank}
                  </span>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <span className="text-gold font-semibold">{entry.rating}</span>
              </div>
            ))}
            {leaderboard?.length === 0 && (
              <p className="text-sm text-muted px-4 py-6 text-center">
                No one's battled yet — be the first.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accentClass = {
    violet: "text-violet",
    gold: "text-gold",
    coral: "text-coral",
  }[accent];

  return (
    <div className="bg-ink-raised border border-ink-line rounded-xl p-5">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}
