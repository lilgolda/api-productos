import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api.js";
import { productSchema } from "../schemas.js";

export default function ProductForm({ onUnauthorized }) {
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
      // Refresca la lista y limpia el formulario
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
    },
    onError: (error) => {
      // Si el token venció o es inválido, volvemos al login
      if (error.status === 401) onUnauthorized();
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <h2>Nuevo producto</h2>

      <label>
        Nombre
        <input {...register("name")} />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </label>

      <label>
        Precio
        <input type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
        {errors.price && <span className="error">{errors.price.message}</span>}
      </label>

      <label>
        Stock
        <input type="number" {...register("stock", { valueAsNumber: true })} />
        {errors.stock && <span className="error">{errors.stock.message}</span>}
      </label>

      {mutation.isError && <p className="error">{mutation.error.message}</p>}
      {mutation.isSuccess && <p className="ok">Producto creado</p>}

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Guardando..." : "Crear producto"}
      </button>
    </form>
  );
}
