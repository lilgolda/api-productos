import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { login, saveToken } from "../api.js";
import { loginSchema } from "../schemas.js";

export default function LoginForm({ onLogin }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token }) => {
      saveToken(token);
      onLogin();
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
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

      {mutation.isError && <p className="error">{mutation.error.message}</p>}

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
