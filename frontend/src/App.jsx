import { useState } from "react";
import { clearToken, getToken } from "./api.js";
import LoginForm from "./components/LoginForm.jsx";
import ProductForm from "./components/ProductForm.jsx";
import ProductList from "./components/ProductList.jsx";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));

  function logout() {
    clearToken();
    setLoggedIn(false);
  }

  return (
    <main>
      <header>
        <h1>Productos</h1>
        {loggedIn && <button onClick={logout}>Cerrar sesión</button>}
      </header>

      {loggedIn ? (
        <ProductForm onUnauthorized={logout} />
      ) : (
        <LoginForm onLogin={() => setLoggedIn(true)} />
      )}

      <h2>Lista de productos</h2>
      <ProductList />
    </main>
  );
}
