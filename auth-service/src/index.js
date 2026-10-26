import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { userRepository } from "./auth/user.repository.js";
import { createAuthService } from "./auth/auth.service.js";
import { createAuthRouter } from "./auth/auth.routes.js";
import { startProductEventsConsumer } from "./messaging/product-events.consumer.js";
import { errorHandler } from "./shared/error-handler.js";

const authService = createAuthService(userRepository);

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", service: "auth-service" }));
app.use(createAuthRouter(authService));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("auth-service conectado a MongoDB");
    await authService.ensureDefaultUser();
    startProductEventsConsumer({ url: process.env.RABBITMQ_URL, service: authService });
    app.listen(PORT, () => console.log(`auth-service en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Error al iniciar auth-service:", err.message);
    process.exit(1);
  });
