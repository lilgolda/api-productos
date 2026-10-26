import { Router } from "express";
import { loginSchema } from "./auth.schema.js";
import { createRequireAuth } from "./auth.middleware.js";


export function createAuthRouter(service) {
  const router = Router();
  const requireAuth = createRequireAuth(service);

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
