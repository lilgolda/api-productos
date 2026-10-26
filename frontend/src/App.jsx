import { useAuth } from "./hooks/useAuth.js";
import LoginForm from "./components/LoginForm.jsx";
import ProductForm from "./components/ProductForm.jsx";
import ProductList from "./components/ProductList.jsx";

export default function App() {
  const { loggedIn, onLoggedIn, logout } = useAuth();

  return (
    <main>
      <header>
        <h1>Productos</h1>
        {loggedIn && <button onClick={logout}>Cerrar sesión</button>}
      </header>

      {loggedIn ? (
        <ProductForm onUnauthorized={logout} />
      ) : (
        <LoginForm onLogin={onLoggedIn} />
      )}

      <h2>Lista de productos</h2>
      <ProductList />
    </main>
  );
}
