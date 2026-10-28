import { test, expect } from "@playwright/test";

const API = "http://localhost:8080";

async function loginUI(page, username = "admin", password = "1234") {
  await page.goto("/login");
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
}

async function fillProduct(page, { name, price, stock }) {
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Precio", { exact: true }).fill(String(price));
  await page.getByLabel("Stock", { exact: true }).fill(String(stock));
}

const rowOf = (page, name) => page.getByRole("row", { name: new RegExp(name) });

test("ruta protegida: sin sesión /products lleva al login", async ({ page }) => {
  await page.goto("/products");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toHaveCount(0);
});

test("un login con clave incorrecta muestra el error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuario", { exact: true }).fill("admin");
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-mala");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Credenciales inválidas")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("registro: crear una cuenta, iniciar sesión y mantener la sesión al recargar", async ({ page }) => {
  const username = `usuario${Date.now()}`;

  await page.goto("/register");
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill("secreto123");
  await page.getByRole("button", { name: "Registrarme" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Cuenta creada. Ya podés iniciar sesión.")).toBeVisible();

  await loginUI(page, username, "secreto123");
  await expect(page).toHaveURL(/\/products$/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
});

test("registro: un usuario que ya existe muestra el error", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Usuario", { exact: true }).fill("admin");
  await page.getByLabel("Contraseña", { exact: true }).fill("secreto123");
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page.getByText("El usuario ya existe")).toBeVisible();
});

test("registro: valida los datos antes de enviar", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Usuario", { exact: true }).fill("ab");
  await page.getByLabel("Contraseña", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page.getByText("El usuario debe tener al menos 3 caracteres")).toBeVisible();
  await expect(page.getByText("La contraseña debe tener al menos 6 caracteres")).toBeVisible();
});

test("CRUD completo desde la interfaz: crear, editar y eliminar un producto", async ({ page }) => {
  const name = `Producto E2E ${Date.now()}`;
  const editedName = `${name} editado`;

  await loginUI(page);

  await fillProduct(page, { name, price: 45.5, stock: 10 });
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText("Producto creado")).toBeVisible();
  await expect(rowOf(page, name)).toContainText("$45.5");
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");

  await page.reload();
  await expect(rowOf(page, name)).toBeVisible();

  await rowOf(page, name).getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar producto" })).toBeVisible();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(name);
  await page.getByLabel("Nombre", { exact: true }).fill(editedName);
  await page.getByLabel("Precio", { exact: true }).fill("60");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
  await expect(rowOf(page, editedName)).toContainText("$60");

  await rowOf(page, editedName).getByRole("button", { name: "Eliminar" }).click();
  await rowOf(page, editedName).getByRole("button", { name: "Confirmar" }).click();
  await expect(rowOf(page, editedName)).toHaveCount(0);
});

test("el formulario de producto muestra los errores de validación y no crea nada", async ({ page }) => {
  await loginUI(page);
  await page.getByRole("button", { name: "Crear producto" }).click();

  await expect(page.getByText("El nombre es obligatorio")).toBeVisible();
  await expect(page.getByText("Ingresá un precio")).toBeVisible();
  await expect(page.getByText("Ingresá el stock")).toBeVisible();
  await expect(page.getByText("Producto creado")).toHaveCount(0);
});

test("cerrar sesión vuelve al login y cierra el acceso a /products", async ({ page }) => {
  await loginUI(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/products");
  await expect(page).toHaveURL(/\/login$/);
});

test("gateway: crear, editar o borrar sin token responde 401", async ({ request }) => {
  const body = { name: "Sin token", price: 1, stock: 1 };
  expect((await request.post(`${API}/products`, { data: body })).status()).toBe(401);
  expect((await request.put(`${API}/products/123`, { data: body })).status()).toBe(401);
  expect((await request.delete(`${API}/products/123`)).status()).toBe(401);
  expect((await request.get(`${API}/products`)).status()).toBe(200);
});

test("comunicación entre servicios: al crear un producto el auth-service suma al contador", async ({ page, request }) => {
  const loginRes = await request.post(`${API}/auth/login`, { data: { username: "admin", password: "1234" } });
  const { token } = await loginRes.json();
  const getCount = async () => {
    const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    return (await me.json()).productsCreated;
  };
  const before = await getCount();

  await loginUI(page);
  await fillProduct(page, { name: `Contador E2E ${Date.now()}`, price: 10, stock: 1 });
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText("Producto creado")).toBeVisible();

  await expect.poll(getCount, { timeout: 10_000 }).toBe(before + 1);
});
