import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api.js";
import { productSchema } from "../schemas.js";
import { useAuth } from "./useAuth.js";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
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
      if (error.status === 401) logout();
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
