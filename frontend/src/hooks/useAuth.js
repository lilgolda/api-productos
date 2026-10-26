import { useState } from "react";
import { clearToken, getToken } from "../api.js";

// Estado de sesión: ¿hay token guardado?
export function useAuth() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));

  const onLoggedIn = () => setLoggedIn(true);

  const logout = () => {
    clearToken();
    setLoggedIn(false);
  };

  return { loggedIn, onLoggedIn, logout };
}
