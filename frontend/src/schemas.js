import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z
    .number({ message: "Ingresá un precio" })
    .positive("El precio debe ser mayor que 0"),
  stock: z
    .number({ message: "Ingresá el stock" })
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Ingresá el usuario"),
  password: z.string().min(1, "Ingresá la contraseña"),
});
