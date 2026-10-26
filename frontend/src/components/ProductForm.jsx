import { useCreateProduct } from "../hooks/useCreateProduct.js";

export default function ProductForm({ onUnauthorized }) {
  const { register, errors, onSubmit, isPending, isError, isSuccess, errorMessage } =
    useCreateProduct(onUnauthorized);

  return (
    <form onSubmit={onSubmit}>
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

      {isError && <p className="error">{errorMessage}</p>}
      {isSuccess && <p className="ok">Producto creado</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear producto"}
      </button>
    </form>
  );
}
