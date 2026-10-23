import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api.js";

export default function ProductList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  if (isLoading) return <p>Cargando productos...</p>;
  if (isError) return <p className="error">Error: {error.message}</p>;
  if (data.length === 0) return <p>Todavía no hay productos.</p>;

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
        {data.map((product) => (
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
