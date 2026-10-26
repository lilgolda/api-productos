import { User } from "./user.model.js";

export const userRepository = {
  findByUsername: (username) => User.findOne({ username }),
  create: (data) => User.create(data),
  incrementProductsCreated: (username) =>
    User.updateOne({ username }, { $inc: { productsCreated: 1 } }),
};
