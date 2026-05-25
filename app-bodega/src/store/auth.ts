import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: number;
  email: string;
  rol: string;
  nombre_completo?: string;
  nombres?: string;
  apellido_paterno?: string;
  producer_id?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem('simac_token', token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('simac_token');
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'simac-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
