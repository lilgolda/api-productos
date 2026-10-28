export default function ProductFields({ register, errors }) {
  return (
    <>
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
    </>
  );
}
