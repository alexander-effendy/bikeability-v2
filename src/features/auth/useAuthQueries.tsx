// src/features/auth/useAuthQueries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { login, fetchMe, logout, type User } from "../../api/routes/auth";

export const meQueryKey = ["auth", "me"] as const;

// 1) Get current user (or null if not logged in)
export function useMe() {
  return useQuery<User>({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    retry: false, // don't keep retrying if unauthorized
  });
}

// 2) Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { username: string; password: string }) =>
      login(payload.username, payload.password),
    onSuccess: (user) => {
      // put user into the "me" cache so everything sees updated state
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

// 3) Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // clear "me" from cache
      queryClient.removeQueries({ queryKey: meQueryKey });
    },
  });
}
