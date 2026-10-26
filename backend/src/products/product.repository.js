import mongoose from "mongoose";
import { Product } from "./product.model.js";

export const productRepository = {
  isValidId: (id) => mongoose.isValidObjectId(id),
  create: (data) => Product.create(data),
  findAll: () => Product.find(),
  findById: (id) => Product.findById(id),
  update: (id, data) => Product.findByIdAndUpdate(id, data, { new: true }),
  delete: (id) => Product.findByIdAndDelete(id),
};
