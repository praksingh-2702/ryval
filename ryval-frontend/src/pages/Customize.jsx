import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useProfile } from "../lib/queries";
import Avatar from "../components/avatar/Avatar";
import AvatarEditor from "../components/avatar/AvatarEditor";
import { normalizeAvatar, randomAvatar } from "../components/avatar/parts";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import Wordmark from "../components/Wordmark";

// Used right after signup (state.welcome) and later from the profile menu.
export default function Customize() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [draft, setDraft] = useState(null);

  const welcome = Boolean(location.state?.welcome);
  // Until the player edits something, show what the server has stored.
  const avatar = draft ?? (profile ? normalizeAvatar(profile.avatar) : null);

  const save = useMutation({
    mutationFn: async (a) => (await api.put("/users/me/avatar", a)).data,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["me"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      navigate("/dashboard");
    },
  });

  if (!avatar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ice">
        <p className="text-soft">Loading your sigil</p>
      </div>
    );
  }

  const errorMessage =
    save.error?.response?.data?.error || (save.error ? "Couldn't save your sigil. Try again." : "");

  return (
    <div className="min-h-screen bg-ice text-ink">
      <header className="border-b-2 border-ink px-6 py-5 md:px-12">
        <Wordmark />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 md:px-12">
        <h1 className="font-display text-6xl font-black leading-none md:text-7xl">
          {welcome ? "Build your sigil" : "Edit your sigil"}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-soft">
          {welcome
            ? "This is how opponents see you before every battle. You can change it any time from the menu."
            : "This is what opponents see before every battle."}
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
          <Panel className="h-fit p-8 text-center lg:sticky lg:top-8">
            <div className="flex justify-center">
              <Avatar avatar={avatar} size={200} shadow />
            </div>
            <p className="mt-6 truncate font-display text-5xl font-extrabold leading-none">
              {profile.username}
            </p>
            <p className="mt-2 text-soft">Rating {profile.rating}</p>
            <Button variant="plain" className="mt-6 w-full" onClick={() => setDraft(randomAvatar())}>
              Shuffle
            </Button>
          </Panel>

          <Panel className="p-8">
            <AvatarEditor value={avatar} onChange={setDraft} />

            {errorMessage && (
              <p className="mt-8 rounded-lg border-2 border-ink bg-coral/25 px-4 py-3 font-medium">
                {errorMessage}
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" disabled={save.isPending} onClick={() => save.mutate(avatar)}>
                {save.isPending ? "Saving" : "Save sigil"}
              </Button>
              {!welcome && (
                <Button size="lg" variant="plain" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
