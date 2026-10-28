import { useProducts } from "../hooks/useProducts.js";
import ProductRow from "./ProductRow.jsx";

export default function ProductList({ onEdit }) {
  const { products, isLoading, isError, errorMessage } = useProducts();

  if (isLoading) return <p>Cargando productos...</p>;
  if (isError) return <p className="error">Error: {errorMessage}</p>;
  if (products.length === 0) return <p>Todavía no hay productos.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <ProductRow key={product._id} product={product} onEdit={onEdit} />
        ))}
      </tbody>
    </table>
  );
}
