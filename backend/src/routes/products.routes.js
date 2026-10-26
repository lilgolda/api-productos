import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { productSchema } from "../schemas/product.schema.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

function validate(req, res, next) {
  const result = productSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  req.body = result.data;
  next();
}

function validateId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  next();
}

router.post("/", requireAuth, validate, async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.get("/:id", validateId, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

router.put("/:id", validateId, validate, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

router.delete("/:id", validateId, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.status(204).send();
});

export default router;
