import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(6).max(100),
});
