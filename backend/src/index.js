import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { productRepository } from "./products/product.repository.js";
import { createProductService } from "./products/product.service.js";
import { createProductRouter } from "./products/product.routes.js";
import authRouter from "./auth/auth.routes.js";
import { errorHandler } from "./shared/error-handler.js";

// Armado de las capas: repositorio -> servicio (casos de uso) -> rutas
const productService = createProductService(productRepository);

const app = express();
app.use(cors());
app.use(express.json());
app.use(authRouter);
app.use("/products", createProductRouter(productService));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Conectado a MongoDB");
    app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err.message);
  });
