import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function LoginPage() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loggedIn) return <Navigate to="/products" replace />;

  return (
    <>
      {location.state?.registered && <p className="ok">Cuenta creada. Ya podés iniciar sesión.</p>}
      <LoginForm onSuccess={() => navigate("/products")} />
      <p>
        ¿No tenés cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </>
  );
}
