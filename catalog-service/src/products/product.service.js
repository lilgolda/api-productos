import { NotFoundError } from "../shared/errors.js";

export function createProductService(repository, events) {
  return {
    isValidId: (id) => repository.isValidId(id),

    async create(data, createdBy) {
      const product = await repository.create(data);

      try {
        await events.publish("product.created", {
          productId: String(product._id),
          name: product.name,
          createdBy,
          at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("No se pudo publicar product.created:", err.message);
      }

      return product;
    },

    list: () => repository.findAll(),

    async getById(id) {
      const product = await repository.findById(id);
      if (!product) throw new NotFoundError("Producto no encontrado");
      return product;
    },

    async update(id, data) {
      const product = await repository.update(id, data);
      if (!product) throw new NotFoundError("Producto no encontrado");
      return product;
    },

    async remove(id) {
      const product = await repository.delete(id);
      if (!product) throw new NotFoundError("Producto no encontrado");
    },
  };
}
