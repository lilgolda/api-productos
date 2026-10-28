import { useState } from "react";
import { useDeleteProduct } from "../hooks/useDeleteProduct.js";

export default function ProductRow({ product, onEdit }) {
  const [confirming, setConfirming] = useState(false);
  const { remove, isPending, isError, errorMessage } = useDeleteProduct();

  return (
    <tr>
      <td>{product.name}</td>
      <td>${product.price}</td>
      <td>{product.stock}</td>
      <td className="actions">
        {confirming ? (
          <>
            <button className="danger" disabled={isPending} onClick={() => remove(product._id)}>
              Confirmar
            </button>
            <button className="secondary" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button className="secondary" onClick={() => onEdit(product)}>
              Editar
            </button>
            <button className="secondary" onClick={() => setConfirming(true)}>
              Eliminar
            </button>
          </>
        )}
        {isError && <span className="error">{errorMessage}</span>}
      </td>
    </tr>
  );
}
