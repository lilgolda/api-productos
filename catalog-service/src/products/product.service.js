import { NotFoundError } from "../shared/errors.js";

const silentLogger = { error() {} };

export function createProductService(repository, events, logger = silentLogger) {
  return {
    isValidId: (id) => repository.isValidId(id),

    async create(data, createdBy) {
      const product = await repository.create(data);

      try {
        await events.publish("producto.creado", {
          productId: String(product._id),
          name: product.name,
          createdBy,
          at: new Date().toISOString(),
        });
      } catch (err) {
        logger.error({ err, productId: String(product._id) }, "No se pudo publicar producto.creado");
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
