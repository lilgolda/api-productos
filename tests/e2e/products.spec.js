import { test, expect } from "@playwright/test";

const AUTH_API = "http://localhost:4000";
const CATALOG_API = "http://localhost:3000";

// Deja la sesión iniciada con el usuario de prueba
async function loginUI(page) {
  await page.goto("/");
  await page.getByLabel("Usuario", { exact: true }).fill("admin");
  await page.getByLabel("Contraseña", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
}

async function fillProduct(page, { name, price, stock }) {
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Precio", { exact: true }).fill(String(price));
  await page.getByLabel("Stock", { exact: true }).fill(String(stock));
}

test("sin sesión se ve el login y no el formulario de productos", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lista de productos" })).toBeVisible();
});

test("un login con clave incorrecta muestra el error", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Usuario", { exact: true }).fill("admin");
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-mala");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Credenciales inválidas")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toHaveCount(0);
});

test("flujo principal: iniciar sesión y crear un producto", async ({ page }) => {
  const name = `Producto E2E ${Date.now()}`;

  await loginUI(page);
  await fillProduct(page, { name, price: 45.5, stock: 10 });
  await page.getByRole("button", { name: "Crear producto" }).click();

  // Confirmación y aparición en la lista
  await expect(page.getByText("Producto creado")).toBeVisible();
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("$45.5");
  await expect(row).toContainText("10");

  // El formulario se limpia
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");

  // Sigue ahí después de recargar (quedó guardado y la sesión se mantiene)
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(name) })).toBeVisible();
});

test("el formulario muestra los errores de validación y no crea nada", async ({ page }) => {
  await loginUI(page);
  await page.getByRole("button", { name: "Crear producto" }).click();

  await expect(page.getByText("El nombre es obligatorio")).toBeVisible();
  await expect(page.getByText("Ingresá un precio")).toBeVisible();
  await expect(page.getByText("Ingresá el stock")).toBeVisible();
  await expect(page.getByText("Producto creado")).toHaveCount(0);
});

test("cerrar sesión vuelve a mostrar el login", async ({ page }) => {
  await loginUI(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toHaveCount(0);
});

test("API: crear un producto sin token responde 401", async ({ request }) => {
  const res = await request.post(`${CATALOG_API}/products`, {
    data: { name: "Sin token", price: 1, stock: 1 },
  });
  expect(res.status()).toBe(401);
});

test("comunicación entre servicios: al crear un producto el auth-service suma al contador", async ({ page, request }) => {
  const loginRes = await request.post(`${AUTH_API}/login`, { data: { username: "admin", password: "1234" } });
  const { token } = await loginRes.json();
  const getCount = async () => {
    const me = await request.get(`${AUTH_API}/me`, { headers: { Authorization: `Bearer ${token}` } });
    return (await me.json()).productsCreated;
  };
  const before = await getCount();

  await loginUI(page);
  await fillProduct(page, { name: `Contador E2E ${Date.now()}`, price: 10, stock: 1 });
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText("Producto creado")).toBeVisible();

  // El evento puede tardar un instante en llegar (con RabbitMQ real es asíncrono)
  await expect.poll(getCount, { timeout: 10_000 }).toBe(before + 1);
});
