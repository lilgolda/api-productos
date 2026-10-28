import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "./RegisterForm.jsx";
import { registerUser } from "../api.js";
import { renderWithProviders } from "../test/utils.jsx";

vi.mock("../api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  registerUser: vi.fn(),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    registerUser.mockReset();
  });

  it("valida el largo del usuario y de la contraseña antes de llamar al backend", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("Usuario"), "an");
    await user.type(screen.getByLabelText("Contraseña"), "123");
    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(await screen.findByText("El usuario debe tener al menos 3 caracteres")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener al menos 6 caracteres")).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("con datos válidos envía el registro y avisa que terminó", async () => {
    registerUser.mockResolvedValue({ username: "ana" });
    const onRegistered = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm onRegistered={onRegistered} />);

    await user.type(screen.getByLabelText("Usuario"), "ana");
    await user.type(screen.getByLabelText("Contraseña"), "secreto1");
    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    await waitFor(() => expect(onRegistered).toHaveBeenCalled());
    expect(registerUser.mock.calls[0][0]).toEqual({ username: "ana", password: "secreto1" });
  });

  it("muestra el error si el usuario ya existe", async () => {
    registerUser.mockRejectedValue(new Error("El usuario ya existe"));
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "secreto1");
    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(await screen.findByText("El usuario ya existe")).toBeInTheDocument();
  });
});
