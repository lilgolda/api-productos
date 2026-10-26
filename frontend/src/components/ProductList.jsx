import { useProducts } from "../hooks/useProducts.js";

export default function ProductList() {
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
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product._id}>
            <td>{product.name}</td>
            <td>${product.price}</td>
            <td>{product.stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
