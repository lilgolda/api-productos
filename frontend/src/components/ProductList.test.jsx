import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductList from "./ProductList.jsx";
import { deleteProduct, getProducts } from "../api.js";
import { renderWithProviders } from "../test/utils.jsx";

vi.mock("../api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  getProducts: vi.fn(),
  deleteProduct: vi.fn(),
}));

const products = [
  { _id: "1", name: "Teclado", price: 45.5, stock: 10 },
  { _id: "2", name: "Mouse", price: 5, stock: 0 },
];

describe("ProductList", () => {
  beforeEach(() => {
    getProducts.mockReset();
    deleteProduct.mockReset();
  });

  it("muestra 'Cargando' mientras llegan los datos y después la tabla", async () => {
    getProducts.mockResolvedValue(products);
    renderWithProviders(<ProductList onEdit={() => {}} />, { token: "t" });

    expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
    expect(await screen.findByText("Teclado")).toBeInTheDocument();
    expect(screen.getByText("$45.5")).toBeInTheDocument();
    expect(screen.getByText("Mouse")).toBeInTheDocument();
  });

  it("muestra un mensaje si no hay productos", async () => {
    getProducts.mockResolvedValue([]);
    renderWithProviders(<ProductList onEdit={() => {}} />, { token: "t" });
    expect(await screen.findByText("Todavía no hay productos.")).toBeInTheDocument();
  });

  it("muestra el error si falla la carga", async () => {
    getProducts.mockRejectedValue(new Error("Servicio no disponible"));
    renderWithProviders(<ProductList onEdit={() => {}} />, { token: "t" });
    expect(await screen.findByText("Error: Servicio no disponible")).toBeInTheDocument();
  });

  it("el botón Editar avisa con el producto de esa fila", async () => {
    getProducts.mockResolvedValue(products);
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ProductList onEdit={onEdit} />, { token: "t" });

    const fila = (await screen.findByText("Mouse")).closest("tr");
    await user.click(fila.querySelector("button"));

    expect(onEdit).toHaveBeenCalledWith(products[1]);
  });

  it("borrar pide confirmación y recién entonces llama al backend", async () => {
    getProducts.mockResolvedValue(products);
    deleteProduct.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ProductList onEdit={() => {}} />, { token: "t" });

    const fila = (await screen.findByText("Teclado")).closest("tr");
    await user.click(fila.querySelectorAll("button")[1]);
    expect(deleteProduct).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledTimes(1));
    expect(deleteProduct.mock.calls[0][0]).toBe("1");
  });
});
