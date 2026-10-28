# Sistema de productos (microservicios)

Aplicación full stack para gestionar productos, con registro e inicio de sesión de usuarios. El backend está dividido en **dos microservicios** detrás de un **API Gateway**, cada servicio con su **propia base de datos**, y se comunican de forma asíncrona con **RabbitMQ**. Todo se levanta con **Docker Compose**.

**Tecnologías:** React + Vite (React Router, TanStack Query, React Hook Form, Zod) · Node.js + Express · MongoDB (Mongoose) · RabbitMQ · JWT + bcrypt · Docker Compose · Vitest, Supertest, React Testing Library y Playwright · pino (logging estructurado).

## Arquitectura

```
                          +--------------------------+      +--------------+
                    +---> |  auth-service  (:4000)   | ---> |  mongo-auth  |
                    |     |  registro, login, JWT    |      |  auth_db     |
                    |     +-----------+--------------+      +--------------+
 Frontend --> API Gateway             |  ^
 (React)     (:8080)           usuario.creado | producto.creado
 :5173       /auth/*  -> auth        v  |
             /products/* -> catalog  RabbitMQ  (exchange "eventos")
                    |                ^  |
                    |     +----------+--v-----------+      +----------------+
                    +---> |  catalog-service (:3000) | ---> |  mongo-catalog |
                          |  CRUD de productos       |      |  catalog_db    |
                          +--------------------------+      +----------------+
```

- El **frontend** solo habla con el **gateway** (`http://localhost:8080`). Los servicios no publican puertos hacia afuera.
- **auth-service**: registro (bcrypt), login y emisión del JWT. Base de datos propia `auth_db`.
- **catalog-service**: CRUD de productos. Base de datos propia `catalog_db`. Comprueba el JWT por su cuenta con la clave compartida.
- Ningún servicio lee la base de datos del otro: lo que necesitan saber el uno del otro lo reciben por eventos.

## Levantar todo con Docker (desde cero)

Requisitos: [Git](https://git-scm.com/) y [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

1. Clonar el repositorio:

   ```bash
   git clone <URL-DEL-REPOSITORIO>
   cd <CARPETA-DEL-REPOSITORIO>
   ```

2. (Opcional) Crear `.env` con tu propia clave para firmar los tokens. Si no lo hacés, se usa una clave de desarrollo.

   ```bash
   # Windows (PowerShell)
   copy .env.example .env
   # Mac / Linux
   cp .env.example .env
   ```

3. Levantar todo (servicios, gateway, frontend, bases de datos y RabbitMQ):

   ```bash
   docker compose up --build
   ```

   La primera vez tarda varios minutos. Está listo cuando en los logs aparecen `auth-service escuchando`, `catalog-service escuchando` y `gateway escuchando`.

4. Abrir http://localhost:5173, crear una cuenta (o entrar con el usuario de prueba **`admin`** / **`1234`**) y usar el CRUD de productos.

| Qué | Dirección |
|---|---|
| Frontend | http://localhost:5173 |
| API Gateway (única entrada al backend) | http://localhost:8080 |
| Panel de RabbitMQ | http://localhost:15672 (usuario `rabbit`, clave `rabbit`) |

Apagar: `docker compose down`. Empezar de cero borrando las bases de datos: `docker compose down -v`.

### Correr el frontend en modo desarrollo (opcional)

Con `docker compose up` ya corriendo, en otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Se abre en http://localhost:5173 (apagá antes el contenedor `frontend` con `docker compose stop frontend` para liberar el puerto).

### Si algo falla

| Problema | Solución |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop no está abierto. Abrilo y esperá a que termine de iniciar. |
| `port is already allocated` | Otro programa usa ese puerto (5173, 8080, 5672, 15672, 27017 o 27018). Cerralo o cambiá el número de la izquierda en `docker-compose.yml`. |
| Cambié código y no se nota | Volvé a correr `docker compose up --build`. |
| El login da error tras cambiar `JWT_SECRET` | Cerrá sesión en el frontend: el token viejo está firmado con la clave anterior. |

## Pruebas

Instalación (una sola vez, desde la raíz del repo): instala las dependencias de todo y el navegador de Playwright.

```bash
npm run install:all
```

Correr todo:

```bash
npm test
```

Por separado: `npm run test:backend`, `npm run test:frontend` y `npm run test:e2e`.

| Nivel | Herramienta | Dónde | Qué cubre |
|---|---|---|---|
| Unitario | Vitest con mocks | `auth-service/src/**/*.test.js`, `catalog-service/src/**/*.test.js` | Los casos de uso (registro, login, productos, eventos), con repositorio, eventos y logger falsos. Sin base de datos |
| Integración | Vitest + Supertest | `auth-service/tests/`, `catalog-service/tests/`, `gateway/tests/` | Cada endpoint por HTTP (validación, JWT, rutas protegidas con y sin token) y la redirección del gateway |
| Componentes React | Vitest + React Testing Library | `frontend/src/components/*.test.jsx` | Login, registro, lista de productos y ruta protegida |
| End-to-end | Playwright | `tests/e2e/` | Un navegador real: registro, login, ruta protegida, CRUD completo, errores de validación y el contador entre servicios |

Para el E2E, Playwright arranca solo un servidor de pruebas (gateway y los dos servicios reales con bases en memoria) y el frontend. Si ya tenés `docker compose up` corriendo, reutiliza ese sistema real; para una corrida limpia, apagalo antes con `docker compose down`. El informe con capturas se abre con `npx playwright show-report`.

## Endpoints

Todos se piden al gateway (`http://localhost:8080`).

| Método | Ruta | Servicio | ¿Requiere token? |
|---|---|---|---|
| POST | `/auth/register` | auth-service | No |
| POST | `/auth/login` | auth-service | No |
| GET | `/auth/me` | auth-service | **Sí** |
| GET | `/products` | catalog-service | No |
| GET | `/products/:id` | catalog-service | No |
| POST | `/products` | catalog-service | **Sí** |
| PUT | `/products/:id` | catalog-service | **Sí** |
| DELETE | `/products/:id` | catalog-service | **Sí** |
| GET | `/health` | gateway | No |

El token se envía en el header `Authorization: Bearer <token>`. Sin token (o con uno inválido o vencido) las rutas protegidas responden **401**. Un dato inválido responde **400** con el detalle, un usuario repetido **409** y, si un servicio no está disponible, el gateway responde **502**.

Reglas: `username` de 3 a 30 caracteres y `password` de al menos 6. Un producto tiene `name` (obligatorio), `price` (positivo) y `stock` (entero, mínimo 0).

## Eventos de mensajería (RabbitMQ)

Un único exchange `eventos` (tipo *topic*) y una cola durable por consumidor.

| Evento | Lo publica | Lo consume | Qué pasa al recibirlo |
|---|---|---|---|
| `usuario.creado` | auth-service, al registrarse un usuario | catalog-service | Guarda una copia mínima del usuario en **su propia** base (`catalog_db`, colección `knownusers`) y escribe un aviso en el log |
| `producto.creado` | catalog-service, al crear un producto | auth-service | Suma 1 al contador `productsCreated` del usuario que lo creó (se ve en `GET /auth/me`) |

Si RabbitMQ falla al publicar, el registro o el producto se crean igual y el error queda en el log.

### Ver los eventos funcionando

```bash
# 1) Registrá un usuario desde el frontend (o con POST /auth/register) y mirá el log del catálogo:
docker compose logs -f catalog-service
#    -> "Usuario nuevo registrado (evento usuario.creado)"

# 2) La copia del usuario quedó en la base del catálogo:
docker compose exec mongo-catalog mongosh catalog_db --quiet --eval "db.knownusers.find().toArray()"

# 3) Panel de RabbitMQ (colas y mensajes): http://localhost:15672
```

Y el evento en sentido contrario, en PowerShell:

```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8080/auth/login -ContentType "application/json" -Body '{"username":"admin","password":"1234"}'
$token = $r.token

# Crear un producto (catalog-service publica producto.creado)
Invoke-RestMethod -Method Post -Uri http://localhost:8080/products -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"name":"Teclado","price":45.5,"stock":10}'

# El auth-service lo recibió: productsCreated sube de a 1
Invoke-RestMethod -Uri http://localhost:8080/auth/me -Headers @{Authorization="Bearer $token"}
```

## Logging

Los servicios y el gateway usan **pino**: cada línea es un JSON con fecha, nivel, servicio y datos, y cada petición queda registrada. Los tokens y cookies nunca se escriben (aparecen como `[Redacted]`). Se ve con `docker compose logs -f <servicio>` (`gateway`, `auth-service` o `catalog-service`). El nivel se cambia con `LOG_LEVEL` (`info` por defecto, `debug` para más detalle).

## Estructura del repositorio

```
docker-compose.yml        orquestación de todo
.env.example              JWT_SECRET
gateway/                  API Gateway (Express + proxy)
auth-service/             registro, login, JWT; publica usuario.creado y consume producto.creado
catalog-service/          CRUD de productos; publica producto.creado y consume usuario.creado
frontend/                 React + Vite
tests/e2e/                pruebas end-to-end (Playwright)
docs/guion-demo.md        guion de la demo
```

Cada servicio tiene su propio `package.json` y `Dockerfile`, y su código agrupado por dominio y en capas (`routes` → `service` → `repository`). El frontend separa componentes (solo interfaz) de hooks (lógica), con páginas y una ruta protegida.

## Decisiones de arquitectura

| Decisión | Por qué |
|---|---|
| **Dos microservicios por dominio** (autenticación y catálogo) | Cambian por motivos distintos y se pueden escalar y desplegar por separado: un cambio o una caída en el login no tumba el catálogo. |
| **API Gateway como única entrada** | El frontend conoce una sola dirección; los servicios no quedan expuestos y se pueden mover o escalar sin tocar el frontend. El gateway no valida tokens: solo redirige, y cada servicio protege lo suyo. |
| **Una base de datos por servicio** | Ningún servicio lee los datos del otro, así evolucionan solos. Lo que deben saber del otro se comunica con eventos (por eso el catálogo guarda su propia copia mínima de los usuarios). |
| **El JWT se verifica en cada servicio** | El auth-service firma y el catálogo comprueba la firma con la clave compartida: no hay una llamada de red por petición y el catálogo sigue funcionando aunque el login esté caído. |
| **RabbitMQ para avisar entre servicios** | El que publica no espera ni falla si el otro no está disponible. A cambio, los datos son consistentes "con retraso" (consistencia eventual). |
| **Capas dentro de cada servicio** (arquitectura hexagonal) | El servicio (lógica de negocio) no importa Express, Mongoose ni RabbitMQ: recibe sus dependencias desde `index.js`. Se prueba sin base de datos y cambiar de base solo obliga a tocar el repositorio. |
| **Frontend: componente + hook, con ruta protegida** | Los componentes solo muestran la interfaz y los hooks concentran el estado y las llamadas. TanStack Query maneja carga, error y refresco de datos (`useQuery`, `useMutation`, `invalidateQueries`). |
| **Validación con Zod en frontend y backend** | En el frontend da respuesta inmediata; en el backend es la que protege los datos: nunca hay que confiar en el cliente. |
| **Pirámide de tests** | Muchos unitarios y de integración (rápidos, ubican el error) y pocos E2E sobre los flujos críticos. |
| **Docker Compose con healthchecks** | Los servicios arrancan cuando las bases de datos y RabbitMQ ya responden; los volúmenes conservan los datos. |

### Limitaciones conocidas

- Las dos bases de datos son MongoDB (una por servicio); no se usa SQL Server.
- El usuario `admin` / `1234` se crea al arrancar solo para facilitar las pruebas.
- Los dos servicios comparten `JWT_SECRET`. En producción conviene firmar con clave privada y verificar con la pública.
- Si RabbitMQ está caído justo al publicar, ese evento se pierde (no hay reintentos ni *outbox*).
- Las credenciales de RabbitMQ y los puertos de las bases de datos publicados en `docker-compose.yml` son solo para desarrollo.
- No hay HTTPS, ni límite de peticiones en el gateway, ni despliegue en la nube.
