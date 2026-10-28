import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct } from "../api.js";
import { productSchema } from "../schemas.js";
import { useAuth } from "./useAuth.js";

export function useUpdateProduct(product, onDone) {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: product.name, price: product.price, stock: product.stock },
  });

  const mutation = useMutation({
    mutationFn: (data) => updateProduct(product._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onDone?.();
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
    errorMessage: mutation.error?.message,
  };
}
