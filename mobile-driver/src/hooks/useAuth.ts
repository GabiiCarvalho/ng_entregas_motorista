// mobile-driver/src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

export interface Motorista {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
  data_nascimento?: string;
  foto_url?: string;
  face_ok: boolean;
  avaliacao: number;
  total_corridas: number;
  cnh_status?: string;
  crlv_status?: string;
  online: boolean;
  lat?: number;
  lng?: number;
}

interface AuthState {
  motorista: Motorista | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
  
  login: (telefone: string, senha: string) => Promise<{ ok: boolean; msg?: string }>;
  register: (data: any) => Promise<{ ok: boolean; msg?: string }>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setMotorista: (m: Motorista | null) => void;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      motorista: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      hydrated: false,

      login: async (telefone, senha) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(telefone, senha);
          if (res.ok) {
            set({
              motorista: res.motorista,
              token: res.token,
              isAuthenticated: true,
              isLoading: false
            });
            return { ok: true };
          }
          set({ isLoading: false });
          return { ok: false, msg: res.msg };
        } catch (error) {
          set({ isLoading: false });
          return { ok: false, msg: 'Sem conexão com o servidor' };
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.cadastrar(data);
          if (res.ok) {
            set({
              motorista: res.motorista,
              token: res.token,
              isAuthenticated: true,
              isLoading: false
            });
            return { ok: true };
          }
          set({ isLoading: false });
          return { ok: false, msg: res.msg };
        } catch (error) {
          set({ isLoading: false });
          return { ok: false, msg: 'Sem conexão com o servidor' };
        }
      },

      logout: async () => {
        await authApi.logout();
        set({
          motorista: null,
          token: null,
          isAuthenticated: false
        });
        try {
          await AsyncStorage.removeItem('auth-storage');
        } catch (error) {
          console.error('Erro ao limpar storage:', error);
        }
      },

      hydrate: async () => {
        try {
          set({ isLoading: true });
          const token = get().token;
          
          if (token) {
            try {
              const res = await authApi.perfil();
              if (res.ok) {
                set({ 
                  motorista: res.motorista, 
                  isAuthenticated: true 
                });
              }
            } catch (error) {
              console.error('Erro ao carregar perfil:', error);
            }
          }
          
          set({ hydrated: true, isLoading: false });
        } catch (error) {
          console.error('Erro ao hidratar:', error);
          set({ hydrated: true, isLoading: false });
        }
      },

      setMotorista: (m) => set({ 
        motorista: m, 
        isAuthenticated: !!m 
      }),

      refresh: async () => {
        try {
          const res = await authApi.perfil();
          if (res.ok) {
            set({ motorista: res.motorista });
          }
        } catch (error) {
          console.error('Erro ao atualizar perfil:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        motorista: state.motorista,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);