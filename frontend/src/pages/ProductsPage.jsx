import { useState } from "react";
import ProductForm from "../components/ProductForm.jsx";
import EditProductForm from "../components/EditProductForm.jsx";
import ProductList from "../components/ProductList.jsx";

export default function ProductsPage() {
  const [editing, setEditing] = useState(null);

  return (
    <>
      {editing ? (
        <EditProductForm key={editing._id} product={editing} onDone={() => setEditing(null)} />
      ) : (
        <ProductForm />
      )}

      <h2>Lista de productos</h2>
      <ProductList onEdit={setEditing} />
    </>
  );
}
