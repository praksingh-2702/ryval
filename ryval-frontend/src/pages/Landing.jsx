import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Trophy, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink text-paper overflow-hidden">
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <span className="font-display text-2xl font-bold tracking-tight">
          RYVAL
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-muted hover:text-paper transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-paper text-ink px-4 py-2 rounded-full hover:bg-violet hover:text-white transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero: two combatant cards colliding toward center */}
      <section className="relative px-6 md:px-12 pt-10 md:pt-16 pb-24">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight">
            Prove you're
            <br />
            faster and sharper.
          </h1>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto">
            Queue up. Get matched. Answer before your opponent does.
            Every win moves your rating — every loss is a lesson.
          </p>
          <Link
            to="/register"
            className="inline-block mt-8 bg-violet hover:bg-violet-dim transition-colors text-white font-semibold px-8 py-3.5 rounded-full text-base"
          >
            Enter the arena
          </Link>
        </div>

        <div className="relative max-w-4xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-0">
          <motion.div
            initial={{ x: -80, opacity: 0, rotate: -3 }}
            animate={{ x: 0, opacity: 1, rotate: -2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-ink-raised border border-ink-line rounded-2xl p-6 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-violet/20 flex items-center justify-center mb-4">
              <Zap size={18} className="text-violet" />
            </div>
            <p className="font-display text-2xl font-semibold">1,200</p>
            <p className="text-sm text-muted mt-1">your rating, day one</p>
          </motion.div>

          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "backOut" }}
            className="font-display text-3xl md:text-5xl font-bold text-coral px-4 z-10"
          >
            VS
          </motion.span>

          <motion.div
            initial={{ x: 80, opacity: 0, rotate: 3 }}
            animate={{ x: 0, opacity: 1, rotate: 2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-ink-raised border border-ink-line rounded-2xl p-6 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center mb-4">
              <Trophy size={18} className="text-coral" />
            </div>
            <p className="font-display text-2xl font-semibold">±20</p>
            <p className="text-sm text-muted mt-1">rating per battle</p>
          </motion.div>
        </div>
      </section>

      {/* Feature row — quiet, disciplined, no card-grid clichés */}
      <section className="border-t border-ink-line px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-10">
          <div>
            <Users size={20} className="text-violet mb-3" />
            <h2 className="font-display text-lg font-semibold mb-1">
              Fair matchmaking
            </h2>
            <p className="text-sm text-muted">
              You're paired against someone within 100 rating points —
              never a mismatch, always a real fight.
            </p>
          </div>
          <div>
            <Zap size={20} className="text-coral mb-3" />
            <h2 className="font-display text-lg font-semibold mb-1">
              Five questions, one winner
            </h2>
            <p className="text-sm text-muted">
              Fast rounds. Whoever answers more correctly takes the win —
              and the rating.
            </p>
          </div>
          <div>
            <Trophy size={20} className="text-gold mb-3" />
            <h2 className="font-display text-lg font-semibold mb-1">
              Climb the board
            </h2>
            <p className="text-sm text-muted">
              Every battle updates the leaderboard. Consistency beats
              one lucky run.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
