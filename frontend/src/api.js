const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
    const error = new Error(data.error || (data.errors ? "Datos inválidos" : "Error en la petición"));
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export function login(credentials) {
  return request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
}

export function registerUser(data) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export function getProducts() {
  return request("/products");
}

export function createProduct(product) {
  return request("/products", { method: "POST", headers: authHeader(), body: JSON.stringify(product) });
}

export function updateProduct(id, product) {
  return request(`/products/${id}`, { method: "PUT", headers: authHeader(), body: JSON.stringify(product) });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: "DELETE", headers: authHeader() });
}
