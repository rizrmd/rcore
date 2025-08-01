import type { User } from "shared/types";
import { proxy } from "valtio";

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const userWrite = proxy<UserState>({
  user: null,
  loading: true,
  error: null,
});

export const userState = {
  write: userWrite,
  
  setUser(user: User | null) {
    userWrite.user = user;
    userWrite.loading = false;
    userWrite.error = null;
  },
  
  setLoading(loading: boolean) {
    userWrite.loading = loading;
  },
  
  setError(error: string | null) {
    userWrite.error = error;
    userWrite.loading = false;
  },
  
  reset() {
    userWrite.user = null;
    userWrite.loading = true;
    userWrite.error = null;
  },
  
  getUserRole() {
    return userWrite.user?.role || "guest";
  }
};
