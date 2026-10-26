import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { productRepository } from "./products/product.repository.js";
import { createProductService } from "./products/product.service.js";
import { createProductRouter } from "./products/product.routes.js";
import { createEventPublisher } from "./messaging/event-publisher.js";
import { errorHandler } from "./shared/error-handler.js";

const events = createEventPublisher({ url: process.env.RABBITMQ_URL });
const productService = createProductService(productRepository, events);

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", service: "catalog-service" }));
app.use("/products", createProductRouter(productService));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("catalog-service conectado a MongoDB");
    app.listen(PORT, () => console.log(`catalog-service en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err.message);
    process.exit(1);
  });
