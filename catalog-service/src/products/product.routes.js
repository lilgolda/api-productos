import { Router } from "express";
import { productSchema } from "./product.schema.js";
import { requireAuth } from "../auth/auth.middleware.js";

export function createProductRouter(service) {
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
    if (!service.isValidId(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    next();
  }

  router.post("/", requireAuth, validate, async (req, res) => {
    const product = await service.create(req.body, req.user.username);
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
