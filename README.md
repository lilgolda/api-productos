# API de productos

API REST con Express, Zod y MongoDB (Mongoose).

1. Entra a la carpeta backend e instala dependencias: `cd backend && npm install`
2. Crea un archivo `.env` (pudes copiar `.env.example`) con `PORT=3000` y `MONGODB_URI=<tu cadena de conexión>`
3. Levanta el servidor con `npm run dev` y probalo en http://localhost:3000/products


# API de productos + frontend

Backend (Express, Zod, MongoDB/Mongoose, JWT) en `backend/` y frontend (React + Vite) en `frontend/`.

1. Backend: `cd backend && npm install`, creá `.env` copiando `.env.example` (con tu `MONGODB_URI` y un `JWT_SECRET`) y corré `npm run dev` (puerto 3000).
2. Frontend: `cd frontend && npm install && npm run dev` y abrí http://localhost:5173.
3. Login de prueba: usuario `admin`, contraseña `1234`. Sin token, `POST /products` responde 401.

## Refactor de arquitectura (Tarea 3)

No se agregó funcionalidad: se reorganizó el código para separar responsabilidades. La API y la pantalla se comportan igual que antes.

**Backend: por dominio y en capas.** Los archivos ya no se agrupan por tipo (`routes/`, `models/`...) sino por tema: `src/products/`, `src/auth/` y `src/shared/`. Dentro de `products/` el flujo es `product.routes.js` (recibe el request) → `product.service.js` (casos de uso) → `product.repository.js` (habla con MongoDB). El servicio no importa Express ni Mongoose: recibe el repositorio desde `index.js`, que arma las capas. Así la lógica se puede probar sin base de datos (`cd backend && npm test`) y cambiar de base solo obliga a tocar el repositorio.

**Frontend: componente + hook.** La lógica (llamadas a la API, formularios, validación, estados de carga y error) pasó a hooks en `src/hooks/`: `useProducts`, `useCreateProduct`, `useLogin` y `useAuth`. Los componentes solo muestran la interfaz, lo que los hace más simples de leer y de reutilizar.
