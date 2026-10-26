const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";
const CATALOG_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const getToken = () => localStorage.getItem("token");
export const saveToken = (token) => localStorage.setItem("token", token);
export const clearToken = () => localStorage.removeItem("token");

async function request(baseUrl, path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
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
  return request(CATALOG_URL, "/products");
}

export function login(credentials) {
  return request(AUTH_URL, "/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function createProduct(product) {
  return request(CATALOG_URL, "/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(product),
  });
}
