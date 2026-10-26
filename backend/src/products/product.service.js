import { NotFoundError } from "../shared/errors.js";

export function createProductService(repository) {
  return {
    isValidId: (id) => repository.isValidId(id),

    create: (data) => repository.create(data),

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
