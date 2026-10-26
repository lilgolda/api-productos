import { Router } from "express";
import { loginSchema } from "./auth.schema.js";
import { login } from "./auth.service.js";

const router = Router();

router.post("/login", (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }

  const token = login(result.data);
  res.json({ token });
});

export default router;
