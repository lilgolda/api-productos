import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { renderWithProviders } from "../test/utils.jsx";

function Rutas() {
  return (
    <Routes>
      <Route path="/login" element={<p>Pantalla de login</p>} />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <p>Contenido privado</p>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  it("sin sesión lleva al login y no muestra el contenido", () => {
    renderWithProviders(<Rutas />, { route: "/products" });
    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("con sesión iniciada muestra el contenido", () => {
    renderWithProviders(<Rutas />, { route: "/products", token: "token-de-prueba" });
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });
});
