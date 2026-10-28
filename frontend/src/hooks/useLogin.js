import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { login as loginRequest } from "../api.js";
import { loginSchema } from "../schemas.js";
import { useAuth } from "./useAuth.js";

export function useLogin(onSuccess) {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ token }) => {
      login(token);
      onSuccess?.();
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
