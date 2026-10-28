import { useRegister } from "../hooks/useRegister.js";

export default function RegisterForm({ onRegistered }) {
  const { register, errors, onSubmit, isPending, isError, errorMessage } = useRegister(onRegistered);

  return (
    <form onSubmit={onSubmit}>
      <h2>Crear cuenta</h2>

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
        {isPending ? "Creando..." : "Registrarme"}
      </button>
    </form>
  );
}
