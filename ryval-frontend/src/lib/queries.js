import { useQuery } from "@tanstack/react-query";
import api from "./api";

export function useProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
  });
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async () => (await api.get(`/leaderboard?limit=${limit}`)).data,
    refetchInterval: 15000,
  });
}
