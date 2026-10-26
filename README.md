# API de productos (microservicios)

Dos servicios de backend independientes, cada uno con su propia base de datos, que se comunican por RabbitMQ, más un frontend en React. Todo se levanta con Docker.

## Levantar el proyecto

1. Instalá y abrí Docker Desktop.
2. (Opcional) Copiá `.env.example` a `.env` y cambiá `JWT_SECRET`. Si no lo hacés, usa una clave de desarrollo.
3. En la raíz del repo: `docker compose up --build`

| Qué | Dirección |
|---|---|
| Frontend | http://localhost:5173 |
| auth-service (login) | http://localhost:4000 |
| catalog-service (productos) | http://localhost:3000 |
| Panel de RabbitMQ | http://localhost:15672 (usuario `rabbit`, clave `rabbit`) |

Usuario de prueba: `admin` / `1234`. Para apagar todo: `docker compose down` (agregá `-v` para borrar también las bases de datos).

## Arquitectura

```
                 POST /login                        +--------------+
            +--------------------->  auth-service  | mongo-auth   |
            |                        (puerto 4000) | auth_db      |
 Frontend --+                              ^        +--------------+
 (React)    |                              | evento product.created
            |                          RabbitMQ
            |  GET/POST /products          ^
            +--------------------->  catalog-service +--------------+
               (con Bearer JWT)      (puerto 3000)   | mongo-catalog|
                                                     | catalog_db   |
                                                     +--------------+
```

segun yo quedo asi mismo el diseño y el funcionamiento pero si algo llega a fallar hay que rezar por que es en base de docker 

- **auth-service**: login, emisión del JWT y usuarios. Su base de datos (`auth_db`) está en el contenedor `mongo-auth`.
- **catalog-service**: CRUD de productos. Su base de datos (`catalog_db`) está en el contenedor `mongo-catalog`. Comprueba el JWT por su cuenta con la clave compartida, sin llamar al auth-service.
- **Comunicación (RabbitMQ)**: cuando el catálogo crea un producto publica el evento `product.created`. El auth-service lo recibe y suma 1 al contador `productsCreated` del usuario que lo creó. Si RabbitMQ falla, el producto se crea igual.

Los servicios no comparten base de datos ni colecciones: solo se pasan eventos.

### Probar la comunicación (PowerShell)

```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:4000/login -ContentType "application/json" -Body '{"username":"admin","password":"1234"}'
$token = $r.token

# 1) Crear un producto en el catálogo
Invoke-RestMethod -Method Post -Uri http://localhost:3000/products -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"name":"Teclado","price":45.5,"stock":10}'

# 2) Ver el contador en el auth-service (sube de a 1 por producto creado)
Invoke-RestMethod -Uri http://localhost:4000/me -Headers @{Authorization="Bearer $token"}
```

Sin token, `POST /products` responde 401.

## Estructura y por qué

```
auth-service/      login, usuarios y consumidor de eventos
catalog-service/   productos y publicador de eventos
frontend/          React + Vite
docker-compose.yml
```

Dentro de cada servicio el código está agrupado por dominio y en capas: rutas (reciben el request) → servicio (casos de uso, sin Express, Mongoose ni RabbitMQ) → repositorio (habla con la base de datos). Las dependencias se arman en `src/index.js`, así la lógica se prueba sin base de datos: `npm test` dentro de cada servicio. En el frontend la lógica vive en hooks (`src/hooks/`) y los componentes solo muestran la interfaz.

## Sin Docker (opcional)

Hace falta MongoDB (dos bases) y RabbitMQ corriendo. En cada servicio: copia `.env.example` a `.env`, `npm install` y `npm run dev`. En `frontend`: `npm install` y `npm run dev`.
