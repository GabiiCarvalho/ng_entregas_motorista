import { create } from 'zustand';
import { authApi, isLoggedIn, removeToken, type Motorista } from '../services/api';

interface AuthState {
  motorista: Motorista | null;
  hydrated: boolean;
  loading: boolean;
  setMotorista: (m: Motorista | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  motorista: null,
  hydrated:  false,
  loading:   false,

  setMotorista: (m) => set({ motorista: m }),

  hydrate: async () => {
    set({ loading: true });
    try {
      const logged = await isLoggedIn();
      if (logged) {
        const res = await authApi.perfil();
        if (res.ok) set({ motorista: res.motorista });
      }
    } catch {}
    set({ loading: false, hydrated: true });
  },

  logout: async () => {
    await removeToken();
    set({ motorista: null });
  },

  refresh: async () => {
    try {
      const res = await authApi.perfil();
      if (res.ok) set({ motorista: res.motorista });
    } catch {}
  },
}));