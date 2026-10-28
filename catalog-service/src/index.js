import "dotenv/config";
import mongoose from "mongoose";
import { productRepository } from "./products/product.repository.js";
import { createProductService } from "./products/product.service.js";
import { createEventPublisher } from "./messaging/event-publisher.js";
import { startUsuarioEventsConsumer } from "./messaging/usuario-events.consumer.js";
import { knownUserRepository } from "./users/known-user.repository.js";
import { createKnownUserService } from "./users/known-user.service.js";
import { createApp } from "./app.js";
import { logger } from "./shared/logger.js";

const events = createEventPublisher({ url: process.env.RABBITMQ_URL });
const productService = createProductService(productRepository, events, logger);
const knownUserService = createKnownUserService(knownUserRepository, logger);
const app = createApp({ productService });

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Conectado a MongoDB");
    startUsuarioEventsConsumer({ url: process.env.RABBITMQ_URL, service: knownUserService });
    app.listen(PORT, () => logger.info({ port: Number(PORT) }, "catalog-service escuchando"));
  })
  .catch((err) => {
    logger.error({ err }, "Error al conectar a MongoDB");
    process.exit(1);
  });
