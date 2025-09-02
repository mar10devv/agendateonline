import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  browserLocalPersistence,
  type User,
} from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type EstadoPremiumContextType = {
  user: User | null;
  isPremium: boolean | null;
  checkingAuth: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
};

const EstadoPremiumContext = createContext<EstadoPremiumContextType | null>(null);

export const EstadoPremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 🔹 Guardar en localStorage
  const saveLocal = (premium: boolean) => {
    localStorage.setItem("isPremium", JSON.stringify(premium));
  };

  const loadLocal = (): boolean | null => {
    const val = localStorage.getItem("isPremium");
    return val ? JSON.parse(val) : null;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await checkPremium(u.uid);
      } else {
        setIsPremium(null);
        localStorage.removeItem("isPremium");
      }
      setCheckingAuth(false);
    });

    return () => unsub();
  }, []);

  // 🔄 Refrescar cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) checkPremium(user.uid);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // 📌 Función para comprobar premium en Firestore
  const checkPremium = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "Usuarios", uid));
      const premium = snap.exists() ? snap.data()?.premium ?? false : false;
      setIsPremium(premium);
      saveLocal(premium);
    } catch (err) {
      console.error("❌ Error comprobando premium:", err);
      setIsPremium(loadLocal()); // fallback
    }
  };

  const handleLogin = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      alert(`No se pudo iniciar sesión: ${String((e as any)?.code || e)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsPremium(null);
      localStorage.removeItem("isPremium");
    } catch (e) {
      console.error("[EstadoPremiumUser] Error al cerrar sesión:", e);
    }
  };

  return (
    <EstadoPremiumContext.Provider
      value={{ user, isPremium, checkingAuth, handleLogin, handleLogout }}
    >
      {children}
    </EstadoPremiumContext.Provider>
  );
};

// 🔹 Hook para usar el contexto en cualquier componente
export const useEstadoPremium = () => {
  const ctx = useContext(EstadoPremiumContext);
  if (!ctx) throw new Error("useEstadoPremium debe usarse dentro de EstadoPremiumProvider");
  return ctx;
};
