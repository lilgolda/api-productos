// Repositorio de usuarios en memoria: reemplaza a MongoDB en los tests de integración.
export function createInMemoryUserRepository() {
  const users = new Map();

  return {
    findByUsername: async (username) => users.get(username) ?? null,
    create: async (data) => {
      const user = { productsCreated: 0, ...data };
      users.set(user.username, user);
      return user;
    },
    incrementProductsCreated: async (username) => {
      const user = users.get(username);
      if (user) user.productsCreated += 1;
    },
  };
}
