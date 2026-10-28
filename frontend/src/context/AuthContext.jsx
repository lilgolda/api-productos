import { createContext, useCallback, useMemo, useState } from "react";
import { clearToken, getToken, saveToken } from "../api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());

  const login = useCallback((newToken) => {
    saveToken(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  const value = useMemo(() => ({ loggedIn: Boolean(token), login, logout }), [token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
