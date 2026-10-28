import { useUpdateProduct } from "../hooks/useUpdateProduct.js";
import ProductFields from "./ProductFields.jsx";

export default function EditProductForm({ product, onDone }) {
  const { register, errors, onSubmit, isPending, isError, errorMessage } = useUpdateProduct(product, onDone);

  return (
    <form onSubmit={onSubmit}>
      <h2>Editar producto</h2>

      <ProductFields register={register} errors={errors} />

      {isError && <p className="error">{errorMessage}</p>}

      <div className="actions">
        <button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        <button type="button" className="secondary" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
