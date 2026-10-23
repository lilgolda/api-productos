import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import productsRouter from "./routes/products.routes.js";

const app = express();
app.use(express.json());
app.use("/products", productsRouter);

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
