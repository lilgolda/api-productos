import { useLogin } from "../hooks/useLogin.js";

export default function LoginForm({ onLogin }) {
  const { register, errors, onSubmit, isPending, isError, errorMessage } =
    useLogin(onLogin);

  return (
    <form onSubmit={onSubmit}>
      <h2>Iniciar sesión</h2>

      <label>
        Usuario
        <input {...register("username")} />
        {errors.username && <span className="error">{errors.username.message}</span>}
      </label>

      <label>
        Contraseña
        <input type="password" {...register("password")} />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </label>

      {isError && <p className="error">{errorMessage}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
