import "dotenv/config";
import mongoose from "mongoose";
import { userRepository } from "./auth/user.repository.js";
import { createAuthService } from "./auth/auth.service.js";
import { startProductEventsConsumer } from "./messaging/product-events.consumer.js";
import { createApp } from "./app.js";
import { logger } from "./shared/logger.js";

// Armado de las capas: repositorio -> servicio -> app / consumidor de eventos
const authService = createAuthService(userRepository);
const app = createApp({ authService });

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    logger.info("Conectado a MongoDB");
    await authService.ensureDefaultUser();
    startProductEventsConsumer({ url: process.env.RABBITMQ_URL, service: authService });
    app.listen(PORT, () => logger.info({ port: Number(PORT) }, "auth-service escuchando"));
  })
  .catch((err) => {
    logger.error({ err }, "Error al iniciar auth-service");
    process.exit(1);
  });
