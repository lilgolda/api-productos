import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { login, saveToken } from "../api.js";
import { loginSchema } from "../schemas.js";

// Lógica del login: formulario, validación, llamada a la API y guardado del token
export function useLogin(onLoggedIn) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token }) => {
      saveToken(token);
      onLoggedIn();
    },
  });

  return {
    register,
    errors,
    onSubmit: handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
  };
}
