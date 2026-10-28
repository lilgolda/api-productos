import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api.js";

export function useProducts() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  return {
    products: data ?? [],
    isLoading,
    isError,
    errorMessage: error?.message,
  };
}
