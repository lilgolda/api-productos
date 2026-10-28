import { Link, useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <>
      <RegisterForm onRegistered={() => navigate("/login", { state: { registered: true } })} />
      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </>
  );
}
