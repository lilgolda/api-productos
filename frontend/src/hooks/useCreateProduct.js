import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api.js";
import { productSchema } from "../schemas.js";

// Lógica de crear un producto: formulario, validación, llamada a la API y refresco de la lista
export function useCreateProduct(onUnauthorized) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(productSchema) });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
    },
    onError: (error) => {
      // Si el token venció o es inválido, volvemos al login
      if (error.status === 401) onUnauthorized();
    },
  });

  return {
    register,
    errors,
    onSubmit: handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    errorMessage: mutation.error?.message,
  };
}
