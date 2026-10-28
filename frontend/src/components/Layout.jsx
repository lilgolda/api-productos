import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Layout() {
  const { loggedIn, logout } = useAuth();

  return (
    <main>
      <header>
        <h1>Productos</h1>
        <nav>
          {loggedIn ? (
            <button onClick={logout}>Cerrar sesión</button>
          ) : (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Crear cuenta</Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
    </main>
  );
}
