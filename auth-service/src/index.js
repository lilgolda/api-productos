import "dotenv/config";
import mongoose from "mongoose";
import { userRepository } from "./auth/user.repository.js";
import { createAuthService } from "./auth/auth.service.js";
import { createEventPublisher } from "./messaging/event-publisher.js";
import { startProductoEventsConsumer } from "./messaging/producto-events.consumer.js";
import { createApp } from "./app.js";
import { logger } from "./shared/logger.js";

const events = createEventPublisher({ url: process.env.RABBITMQ_URL });
const authService = createAuthService(userRepository, events, logger);
const app = createApp({ authService });

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    logger.info("Conectado a MongoDB");
    await authService.ensureDefaultUser();
    startProductoEventsConsumer({ url: process.env.RABBITMQ_URL, service: authService });
    app.listen(PORT, () => logger.info({ port: Number(PORT) }, "auth-service escuchando"));
  })
  .catch((err) => {
    logger.error({ err }, "Error al iniciar auth-service");
    process.exit(1);
  });
