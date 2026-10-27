# Sistema de productos (microservicios)

Proyecto final del curso. Una aplicación completa para gestionar productos, construida con:

- **Frontend** en React (Vite, TanStack Query, React Hook Form y Zod).
- **Dos servicios backend** independientes (Express): `auth-service` (login y usuarios) y `catalog-service` (productos), cada uno con su propia base de datos MongoDB.
- **RabbitMQ** para la comunicación entre servicios.
- **Docker Compose** para levantar todo con un solo comando.
- **Suite de tests** en tres niveles (unitarios, integración y end-to-end) y **logging estructurado** con pino.

## Qué incluye el repositorio

| Pieza | Dónde está |
|---|---|
| Frontend React | `frontend/` |
| Servicio de autenticación | `auth-service/` |
| Servicio de catálogo de productos | `catalog-service/` |
| Orquestación con Docker | `docker-compose.yml` (raíz) |
| Tests unitarios y de integración | `auth-service/` y `catalog-service/` (`src/**/*.test.js` y `tests/`) |
| Tests end-to-end | `tests/e2e/` y `playwright.config.js` |
| Diseño de microservicios (Tarea 4) | `docs/diseno-microservicios.pdf` |

## Levantar el proyecto desde cero

### Requisitos

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (tiene que estar abierto)
- [Node.js](https://nodejs.org/) 22 o superior (solo hace falta para correr los tests o trabajar sin Docker)

### Pasos

1. Clonar el repositorio y entrar a la carpeta:

   ```bash
   git clone <URL-DEL-REPOSITORIO>
   cd <CARPETA-DEL-REPOSITORIO>
   ```

2. (Opcional) Crear el archivo `.env` con tu propia clave para firmar los tokens. Si no lo hacés, se usa una clave de desarrollo.

   ```bash
   # Windows (PowerShell)
   copy .env.example .env
   # Mac / Linux
   cp .env.example .env
   ```

   Después abrí `.env` y cambiá el valor de `JWT_SECRET` por una frase larga.

3. Levantar todo:

   ```bash
   docker compose up --build
   ```

   La primera vez tarda varios minutos porque descarga imágenes y construye los servicios. Está listo cuando en los logs aparecen `auth-service escuchando` y `catalog-service escuchando`.

4. Abrir http://localhost:5173 e iniciar sesión con el usuario de prueba **`admin`** / **`1234`**. Ya se puede crear un producto y verlo en la lista.

| Qué | Dirección |
|---|---|
| Frontend | http://localhost:5173 |
| auth-service (login) | http://localhost:4000 |
| catalog-service (productos) | http://localhost:3000 |
| Panel de RabbitMQ | http://localhost:15672 (usuario `rabbit`, clave `rabbit`) |

Para apagar todo: `docker compose down`. Para empezar de cero, borrando también las bases de datos: `docker compose down -v`.

### Si algo falla

| Problema | Solución |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop no está abierto. Abrilo y esperá a que termine de iniciar. |
| `port is already allocated` | Otro programa usa ese puerto (3000, 4000, 5173, 5672, 15672, 27017 o 27018). Cerralo o cambiá el número de la izquierda en `docker-compose.yml`. |
| Cambié código y no se nota | Volvé a correr `docker compose up --build`. |
| El login da error tras cambiar `JWT_SECRET` | Cerrá sesión en el frontend: el token viejo está firmado con la clave anterior. |

## Probar la comunicación entre servicios

Crear un producto en el catálogo hace que el servicio de autenticación actualice un contador a través de RabbitMQ. En PowerShell:

```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:4000/login -ContentType "application/json" -Body '{"username":"admin","password":"1234"}'
$token = $r.token

# 1) Crear un producto en el catálogo
Invoke-RestMethod -Method Post -Uri http://localhost:3000/products -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"name":"Teclado","price":45.5,"stock":10}'

# 2) Ver el contador en el auth-service (sube de a 1 por producto creado)
Invoke-RestMethod -Uri http://localhost:4000/me -Headers @{Authorization="Bearer $token"}
```

Sin token, `POST /products` responde 401.

## Correr los tests

Instalación (una sola vez, desde la raíz del repo): instala las dependencias de todo y el navegador de Playwright.

```bash
npm run install:all
```

Correr todo:

```bash
npm test
```

Por separado: `npm run test:services` (unitarios + integración) y `npm run test:e2e`.

| Nivel | Herramienta | Dónde | Qué cubre |
|---|---|---|---|
| Unitario | Vitest con mocks | `auth-service/src/auth/*.test.js`, `catalog-service/src/products/*.test.js` | Los casos de uso, con repositorio, eventos y logger falsos. No hay base de datos |
| Integración | Vitest + Supertest | `auth-service/tests/`, `catalog-service/tests/` | Cada endpoint por HTTP (rutas, validación, JWT, servicio) con la base de datos en memoria |
| End-to-end | Playwright | `tests/e2e/` | Un navegador real: login, crear un producto, errores de validación, cerrar sesión y el contador entre servicios |

Para el E2E, Playwright arranca solo un servidor de pruebas (los dos servicios reales con bases en memoria) y el frontend. Si ya tenés `docker compose up` corriendo, reutiliza ese sistema real; para una corrida limpia, apagalo antes con `docker compose down`. El informe con capturas se abre con `npx playwright show-report`.

## Logging

Los servicios usan **pino**: cada línea de log es un JSON con fecha, nivel, servicio y datos, y cada petición HTTP queda registrada. Los tokens y cookies nunca se escriben (aparecen como `[Redacted]`).

```json
{"level":30,"time":"2026-10-27T03:20:55.108Z","service":"catalog-service","msg":"Conectado a MongoDB"}
```

Se ve con `docker compose logs -f catalog-service` (o `auth-service`). El nivel se cambia con la variable `LOG_LEVEL` (`info` por defecto, `debug` para más detalle, `silent` en los tests).

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
- **Comunicación**: cuando el catálogo crea un producto publica el evento `product.created` en RabbitMQ. El auth-service lo recibe y suma 1 al contador `productsCreated` del usuario que lo creó.

Estructura de carpetas (dentro de cada servicio, el código se agrupa por dominio y en capas):

```
auth-service/src/
  auth/         rutas, servicio (casos de uso), repositorio, modelo y middleware
  messaging/    consumidor de eventos de RabbitMQ
  shared/       errores y logger
  app.js        arma la aplicación Express
  index.js      conecta la base de datos y arranca el servidor
catalog-service/src/
  products/     rutas, servicio (casos de uso), repositorio, modelo y esquema Zod
  auth/         middleware que verifica el JWT
  messaging/    publicador de eventos de RabbitMQ
  shared/       errores y logger
  app.js, index.js
frontend/src/
  components/   solo interfaz (LoginForm, ProductForm, ProductList)
  hooks/        lógica (useAuth, useLogin, useProducts, useCreateProduct)
  api.js        llamadas a los servicios y manejo del token
```

## Decisiones de arquitectura

| Decisión | Por qué |
|---|---|
| **Dos microservicios por dominio**: autenticación y catálogo | Cambian por motivos distintos y se pueden escalar y desplegar por separado: un cambio o una caída en el login no tumba el catálogo. Dividir fue barato porque el código ya estaba agrupado por dominio desde el refactor de la Tarea 3. |
| **Una base de datos por servicio** (dos MongoDB) | Ningún servicio lee los datos del otro, así pueden evolucionar solos. El costo es que lo que deban saber el uno del otro se comunica con eventos, no con una consulta compartida. |
| **El JWT se verifica en cada servicio, sin llamadas entre ellos** | El auth-service firma el token y el catálogo comprueba la firma con la clave compartida. Se evita una llamada de red por petición y el catálogo sigue funcionando aunque el login esté caído. |
| **RabbitMQ para el aviso entre servicios** | El catálogo no tiene que esperar ni fallar si el auth-service no está disponible: publica el evento y sigue. Si RabbitMQ falla, el producto se crea igual y el error queda en los logs. A cambio, el contador es consistente "con retraso" (consistencia eventual). |
| **Capas dentro de cada servicio**: rutas → servicio → repositorio | El servicio (la lógica de negocio) no importa Express, Mongoose ni RabbitMQ: recibe sus dependencias desde `index.js`. Por eso se prueba sin base de datos y cambiar de base solo obliga a tocar el repositorio. |
| **Frontend: componente + hook** | Los componentes solo muestran la interfaz y los hooks (`useProducts`, `useCreateProduct`, `useLogin`, `useAuth`) concentran el estado y las llamadas. TanStack Query maneja los estados de carga y error de los datos del servidor. |
| **Validación con Zod en el frontend y en el backend** | En el frontend da respuesta inmediata al usuario; en el backend es la que realmente protege los datos, porque nunca hay que confiar en el cliente. |
| **Pirámide de tests**: muchos unitarios, integración por endpoint y pocos E2E | Los unitarios y de integración son rápidos y localizan el error; los E2E cubren solo los flujos críticos en un navegador real, porque son más lentos. |
| **Logging estructurado (pino)** | Los logs en JSON se pueden filtrar y analizar; el nivel se controla con una variable y las credenciales se ocultan. |
| **Docker Compose con healthchecks** | Los servicios arrancan solo cuando las bases de datos y RabbitMQ ya responden, y los volúmenes conservan los datos entre reinicios. |

### Limitaciones conocidas y mejoras posibles

- Hay un único usuario (`admin`) creado al arrancar; falta registro de usuarios.
- Los dos servicios comparten la clave `JWT_SECRET`. En producción conviene firmar con una clave privada y verificar con la pública, para que el catálogo no pueda emitir tokens.
- Si RabbitMQ está caído en el momento de crear un producto, ese evento se pierde (no hay reintentos ni "outbox").
- Las credenciales de RabbitMQ y el puerto de las bases de datos expuestos en `docker-compose.yml` son solo para desarrollo.
- No hay API Gateway ni HTTPS: el frontend llama directamente a cada servicio.

## Sin Docker (opcional)

Hace falta MongoDB (dos bases) y RabbitMQ corriendo. Corré `npm run install:all` en la raíz. En cada servicio: copiá `.env.example` a `.env` y ejecutá `npm run dev`. En `frontend`: `npm run dev`.
