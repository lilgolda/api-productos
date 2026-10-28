import { useCreateProduct } from "../hooks/useCreateProduct.js";
import ProductFields from "./ProductFields.jsx";

export default function ProductForm() {
  const { register, errors, onSubmit, isPending, isError, isSuccess, errorMessage } = useCreateProduct();

  return (
    <form onSubmit={onSubmit}>
      <h2>Nuevo producto</h2>

      <ProductFields register={register} errors={errors} />

      {isError && <p className="error">{errorMessage}</p>}
      {isSuccess && <p className="ok">Producto creado</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear producto"}
      </button>
    </form>
  );
}
