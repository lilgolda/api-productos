import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../api.js";
import { useAuth } from "./useAuth.js";

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const mutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: (error) => {
      if (error.status === 401) logout();
    },
  });

  return {
    remove: (id) => mutation.mutate(id),
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
  };
}
