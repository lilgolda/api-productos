import { Router } from "express";
import { productSchema } from "./product.schema.js";
import { requireAuth } from "../auth/auth.middleware.js";

// Capa HTTP: recibe el request, llama al caso de uso y arma la respuesta.
export function createProductRouter(service) {
  const router = Router();

  // Valida el body; si falla responde 400 con el detalle
  function validate(req, res, next) {
    const result = productSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    req.body = result.data;
    next();
  }

  // Valida que el :id tenga formato válido
  function validateId(req, res, next) {
    if (!service.isValidId(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    next();
  }

  router.post("/", requireAuth, validate, async (req, res) => {
    const product = await service.create(req.body);
    res.status(201).json(product);
  });

  router.get("/", async (req, res) => {
    res.json(await service.list());
  });

  router.get("/:id", validateId, async (req, res) => {
    res.json(await service.getById(req.params.id));
  });

  router.put("/:id", validateId, validate, async (req, res) => {
    res.json(await service.update(req.params.id, req.body));
  });

  router.delete("/:id", validateId, async (req, res) => {
    await service.remove(req.params.id);
    res.status(204).send();
  });

  return router;
}
