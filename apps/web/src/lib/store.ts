'use client';

import { create } from 'zustand';

type User = { id: string; name: string; email: string; role: 'STUDENT' | 'ADMIN' } | null;

type AppState = {
  user: User;
  sidebarOpen: boolean;
  playerMuted: boolean;
  setUser: (user: User) => void;
  setSidebarOpen: (open: boolean) => void;
  setPlayerMuted: (muted: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  sidebarOpen: true,
  playerMuted: false,
  setUser: (user) => set({ user }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setPlayerMuted: (playerMuted) => set({ playerMuted }),
}));
