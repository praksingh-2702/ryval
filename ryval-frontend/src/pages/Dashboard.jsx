import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLeaderboard, useProfile } from "../lib/queries";
import Avatar from "../components/avatar/Avatar";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import ProfileMenu from "../components/ProfileMenu";
import Wordmark from "../components/Wordmark";

const plural = (n, one, many) => (n === 1 ? one : many);

// Wins, losses and draws as one proportional bar, so the shape of a
// record reads at a glance. Draws are shown here and nowhere else.
function RecordBar({ wins, losses, draws }) {
  const total = wins + losses + draws;
  const segments = [
    { key: "wins", n: wins, fill: "bg-lemon", text: `${wins} ${plural(wins, "win", "wins")}` },
    { key: "losses", n: losses, fill: "bg-coral", text: `${losses} ${plural(losses, "loss", "losses")}` },
    { key: "draws", n: draws, fill: "bg-ink/20", text: `${draws} ${plural(draws, "draw", "draws")}` },
  ];

  return (
    <div>
      <div className="flex h-7 overflow-hidden rounded-full border-2 border-ink bg-card">
        {segments
          .filter((s) => s.n > 0)
          .map((s) => (
            <div
              key={s.key}
              className={`${s.fill} border-r-2 border-ink last:border-r-0`}
              style={{ flex: `${s.n} 1 0` }}
            />
          ))}
      </div>

      {total === 0 ? (
        <p className="mt-3 text-soft">No battles yet. Your record starts with your first one.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-medium">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span aria-hidden="true" className={`h-3.5 w-3.5 rounded-sm border-2 border-ink ${s.fill}`} />
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(10);

  return (
    <div className="min-h-screen bg-ice text-ink">
      <header className="flex items-center justify-between border-b-2 border-ink px-6 py-4 md:px-12">
        <Wordmark />
        <ProfileMenu />
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 md:px-12">
        <Panel className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar avatar={profile?.avatar} size={120} shadow />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-6xl font-black leading-none sm:text-7xl">
                {user?.username || "player"}
              </h1>
              <p className="mt-3 text-lg">
                <span className="font-display text-5xl font-extrabold tabular-nums">
                  {profile ? profile.rating : "-"}
                </span>{" "}
                <span className="text-soft">rating</span>
              </p>
            </div>
          </div>

          <div className="mt-8">
            <RecordBar
              wins={profile?.wins ?? 0}
              losses={profile?.losses ?? 0}
              draws={profile?.draws ?? 0}
            />
          </div>
        </Panel>

        <Button size="xl" className="mt-8 w-full" onClick={() => navigate("/queue")}>
          Find a battle
        </Button>

        <section className="mt-14">
          <h2 className="font-display text-4xl font-extrabold">Leaderboard</h2>

          <Panel className="mt-4 overflow-hidden">
            {leaderboardLoading && <p className="px-6 py-8 text-center text-soft">Loading the board</p>}

            {leaderboard?.length === 0 && (
              <p className="px-6 py-8 text-center text-soft">
                Nobody has battled yet. Be the first on the board.
              </p>
            )}

            <ol>
              {leaderboard?.map((entry, i) => {
                const mine = String(entry.userId) === String(user?.userId);
                return (
                  <li
                    key={entry.userId}
                    className={`flex items-center gap-4 px-5 py-3 ${mine ? "bg-lemon" : ""} ${
                      i < leaderboard.length - 1 ? "border-b-2 border-ink/15" : ""
                    }`}
                  >
                    <span className="w-6 font-display text-3xl font-extrabold tabular-nums text-soft">
                      {entry.rank}
                    </span>
                    <Avatar avatar={entry.avatar} size={44} />
                    <span className="min-w-0 flex-1 truncate font-display text-3xl font-bold">
                      {entry.username}
                    </span>
                    <span className="font-display text-3xl font-extrabold tabular-nums">{entry.rating}</span>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </section>
      </main>
    </div>
  );
}
