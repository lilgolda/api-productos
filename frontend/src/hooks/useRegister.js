import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../api.js";
import { registerSchema } from "../schemas.js";

export function useRegister(onRegistered) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => onRegistered?.(),
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
