import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();

// Usuario fijo para esta etapa del curso
const USER = "admin";
const PASSWORD = "1234";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }

  const { username, password } = result.data;
  if (username !== USER || password !== PASSWORD) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
});

export default router;
