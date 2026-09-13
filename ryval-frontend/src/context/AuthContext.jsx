import { createContext, useContext, useState, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ryval_user");
    return stored ? JSON.parse(stored) : null;
  });

  const persist = (token, userId, username) => {
    localStorage.setItem("ryval_token", token);
    const userObj = { userId, username };
    localStorage.setItem("ryval_user", JSON.stringify(userObj));
    setUser(userObj);
  };

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post("/auth/register", { username, email, password });
    persist(data.token, data.userId, data.username);
    return data;
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    persist(data.token, data.userId, data.username);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ryval_token");
    localStorage.removeItem("ryval_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
