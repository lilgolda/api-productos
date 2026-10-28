import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm.jsx";
import { login } from "../api.js";
import { renderWithProviders } from "../test/utils.jsx";

vi.mock("../api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  login: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    login.mockReset();
  });

  it("muestra los campos y el botón", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("muestra los errores de validación y no llama al backend si el formulario está vacío", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Ingresá el usuario")).toBeInTheDocument();
    expect(screen.getByText("Ingresá la contraseña")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("con datos correctos guarda el token y avisa que el login salió bien", async () => {
    login.mockResolvedValue({ token: "token-de-prueba" });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "1234");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(login.mock.calls[0][0]).toEqual({ username: "admin", password: "1234" });
    expect(localStorage.getItem("token")).toBe("token-de-prueba");
  });

  it("si el backend rechaza las credenciales muestra el error y no guarda ningún token", async () => {
    login.mockRejectedValue(new Error("Credenciales inválidas"));
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "mala");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
