// Repositorio de productos en memoria: reemplaza a MongoDB en los tests de integración.
export function createInMemoryProductRepository() {
  const items = new Map();
  let counter = 0;

  return {
    isValidId: (id) => /^[0-9]+$/.test(String(id)),
    create: async (data) => {
      const product = { _id: String(++counter), ...data };
      items.set(product._id, product);
      return product;
    },
    findAll: async () => [...items.values()],
    findById: async (id) => items.get(id) ?? null,
    update: async (id, data) => {
      if (!items.has(id)) return null;
      const product = { ...items.get(id), ...data };
      items.set(id, product);
      return product;
    },
    delete: async (id) => {
      const product = items.get(id) ?? null;
      items.delete(id);
      return product;
    },
  };
}
