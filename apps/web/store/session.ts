import { create } from "zustand";
import { fetchDashboard, login, type DashboardRow, type SessionUser } from "@/lib/api";

type LoadState = "idle" | "loading" | "ready" | "error";

interface SessionState {
  accessToken: string | null;
  user: SessionUser | null;
  rows: DashboardRow[];
  authState: LoadState;
  dashboardState: LoadState;
  error: string | null;
  signIn(email: string, password: string): Promise<void>;
  loadDashboard(): Promise<void>;
  signOut(): void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  accessToken: null,
  user: null,
  rows: [],
  authState: "idle",
  dashboardState: "idle",
  error: null,

  async signIn(email, password) {
    set({ authState: "loading", error: null });
    try {
      const session = await login(email, password);
      set({ accessToken: session.accessToken, user: session.user, authState: "ready" });
      await get().loadDashboard();
    } catch (error) {
      set({ authState: "error", error: error instanceof Error ? error.message : "Login failed" });
    }
  },

  async loadDashboard() {
    const accessToken = get().accessToken;
    if (!accessToken) return;

    set({ dashboardState: "loading", error: null });
    try {
      const rows = await fetchDashboard(accessToken);
      set({ rows, dashboardState: "ready" });
    } catch (error) {
      set({ dashboardState: "error", error: error instanceof Error ? error.message : "Dashboard failed to load" });
    }
  },

  signOut() {
    set({ accessToken: null, user: null, rows: [], authState: "idle", dashboardState: "idle", error: null });
  },
}));

