import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCurrentSession, onAuthStateChange } from "./supabase";

// Globaler Auth-Zustand für die ganze App.
//
// Beim App-Start ist noch unklar, ob eine Session im SecureStore liegt —
// solange gilt `loading: true` und der RootLayout zeigt einen Spinner statt
// fälschlich kurz den Login-Screen aufblitzen zu lassen.
//
// Danach hält onAuthStateChange den Zustand aktuell: Login, Logout und
// Token-Refresh landen alle hier, und der AuthGate im RootLayout reagiert.

type AuthState = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktiv = true;

    getCurrentSession().then((s) => {
      if (!aktiv) return;
      setSession(s);
      setLoading(false);
    });

    const subscription = onAuthStateChange((s) => {
      if (!aktiv) return;
      setSession(s);
      setLoading(false);
    });

    return () => {
      aktiv = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
