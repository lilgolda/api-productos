import "dotenv/config";
import mongoose from "mongoose";
import { productRepository } from "./products/product.repository.js";
import { createProductService } from "./products/product.service.js";
import { createEventPublisher } from "./messaging/event-publisher.js";
import { createApp } from "./app.js";
import { logger } from "./shared/logger.js";

// Armado de las capas: repositorio + publicador de eventos + logger -> servicio -> app
const events = createEventPublisher({ url: process.env.RABBITMQ_URL });
const productService = createProductService(productRepository, events, logger);
const app = createApp({ productService });

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Conectado a MongoDB");
    app.listen(PORT, () => logger.info({ port: Number(PORT) }, "catalog-service escuchando"));
  })
  .catch((err) => {
    logger.error({ err }, "Error al conectar a MongoDB");
    process.exit(1);
  });
