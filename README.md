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
auth-service/      login, usuarios y consumidor de eventos (src/ y tests/)
catalog-service/   productos y publicador de eventos (src/ y tests/)
frontend/          React + Vite
tests/e2e/         pruebas de punta a punta con Playwright
docker-compose.yml
```

Dentro de cada servicio el código está agrupado por dominio y en capas: rutas (reciben el request) → servicio (casos de uso, sin Express, Mongoose ni RabbitMQ) → repositorio (habla con la base de datos). `src/app.js` arma la aplicación Express y `src/index.js` conecta la base de datos y los servicios reales, así la lógica y los endpoints se prueban sin base de datos. En el frontend la lógica vive en hooks (`src/hooks/`) y los componentes solo muestran la interfaz.

## Pruebas

Instalación (una sola vez, desde la raíz del repo): `npm run install:all` (instala las dependencias de todo y el navegador de Playwright).

Correr todo: `npm test`. Por separado: `npm run test:services` (unitarios + integración) y `npm run test:e2e`.

| Nivel | Herramienta | Dónde | Qué cubre |
|---|---|---|---|
| Unitario | Vitest con mocks | `auth-service/src/auth/*.test.js`, `catalog-service/src/products/*.test.js` | Los casos de uso, con repositorio, eventos y logger falsos. No hay base de datos |
| Integración | Vitest + Supertest | `auth-service/tests/`, `catalog-service/tests/` | Cada endpoint por HTTP (rutas, validación, JWT, servicio) con la base de datos en memoria |
| End-to-end | Playwright | `tests/e2e/` | Un navegador real: login, crear un producto, errores de validación, cerrar sesión y el contador entre servicios |

Para el E2E, Playwright arranca solo un servidor de pruebas (los dos servicios reales con bases en memoria, `tests/e2e/test-server.js`) y el frontend. Si ya tenés `docker compose up` corriendo, reutiliza ese sistema real en lugar del de pruebas. El informe con capturas se abre con `npx playwright show-report`.

## Logging

Los servicios usan **pino**: cada línea de log es un JSON con fecha, nivel, servicio y datos, y cada petición HTTP queda registrada. Los tokens y cookies nunca se escriben (aparecen como `[Redacted]`).

```json
{"level":30,"time":"2026-10-27T03:20:55.108Z","service":"catalog-service","msg":"Conectado a MongoDB"}
```

Se ve con `docker compose logs -f catalog-service` (o `auth-service`). El nivel se cambia con la variable `LOG_LEVEL` (`info` por defecto, `debug` para más detalle, `silent` en los tests).

## Sin Docker (opcional)

Hace falta MongoDB (dos bases) y RabbitMQ corriendo. Corré `npm run install:all` en la raíz. En cada servicio: copiá `.env.example` a `.env` y `npm run dev`. En `frontend`: `npm run dev`.
