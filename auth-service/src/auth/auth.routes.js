import { Router } from "express";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { createRequireAuth } from "./auth.middleware.js";

export function createAuthRouter(service) {
  const router = Router();
  const requireAuth = createRequireAuth(service);

  router.post("/register", async (req, res) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const user = await service.register(result.data);
    res.status(201).json(user);
  });

  router.post("/login", async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const token = await service.login(result.data);
    res.json({ token });
  });

  router.get("/me", requireAuth, async (req, res) => {
    res.json(await service.getProfile(req.user.username));
  });

  return router;
}
