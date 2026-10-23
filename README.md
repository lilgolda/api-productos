# API de productos

API REST con Express, Zod y MongoDB (Mongoose).

1. Entra a la carpeta backend e instala dependencias: `cd backend && npm install`
2. Crea un archivo `.env` (pudes copiar `.env.example`) con `PORT=3000` y `MONGODB_URI=<tu cadena de conexión>`
3. Levanta el servidor con `npm run dev` y probalo en http://localhost:3000/products


# API de productos + frontend

Backend (Express, Zod, MongoDB/Mongoose, JWT) en `backend/` y frontend (React + Vite) en `frontend/`.

1. Backend: `cd backend && npm install`, crea `.env` copiando `.env.example` (con tu `MONGODB_URI` y un `JWT_SECRET`) y corre `npm run dev` (puerto 3000).
2. Frontend: `cd frontend && npm install && npm run dev` y abre http://localhost:5173.
3. Login de prueba: usuario `admin`, contraseña `1234`. Sin token, `POST /products` responde 401.