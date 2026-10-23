const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ---- Token guardado en el navegador ----
export const getToken = () => localStorage.getItem("token");
export const saveToken = (token) => localStorage.setItem("token", token);
export const clearToken = () => localStorage.removeItem("token");

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error || "Error en la petición");
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export function getProducts() {
  return request("/products");
}

export function login(credentials) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// Esta petición necesita token: lo enviamos en el header Authorization
export function createProduct(product) {
  return request("/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(product),
  });
}
