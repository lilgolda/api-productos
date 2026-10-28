# Guion de la demo (10 minutos)

## Antes de empezar (fuera de la demo)

- Docker Desktop abierto.
- `docker compose down -v` para partir de cero y `docker compose up --build` ya corrido, o listo para correr (la primera vez tarda).
- Tener abiertas: el navegador en http://localhost:5173, el panel de RabbitMQ (http://localhost:15672) y una terminal.

## 1. Arrancar todo con un comando (1 min)

1. `docker compose up --build` desde la raíz. Mostrar que levanta bases, RabbitMQ, los dos servicios, el gateway y el frontend.
2. Esperar los mensajes `auth-service escuchando`, `catalog-service escuchando` y `gateway escuchando`.
3. Explicar en una frase el diagrama del README: frontend → gateway → servicios → bases + RabbitMQ.

## 2. Registrarse e iniciar sesión (2 min)

1. En http://localhost:5173/products sin sesión: la **ruta protegida** lleva al login.
2. "Crear cuenta": registrar un usuario nuevo (la contraseña se guarda cifrada con bcrypt).
3. Iniciar sesión con ese usuario: el JWT queda guardado y entra a `/products`.

## 3. El evento de mensajería (2 min)

1. En la terminal: `docker compose logs -f catalog-service`. Se ve **"Usuario nuevo registrado (evento usuario.creado)"**: el auth-service publicó el evento y el catálogo lo consumió.
2. Mostrar que el usuario quedó en la base del catálogo (no la del auth):
   `docker compose exec mongo-catalog mongosh catalog_db --quiet --eval "db.knownusers.find().toArray()"`
3. En el panel de RabbitMQ (pestaña *Queues*): las colas `catalog-service.usuario-creado` y `auth-service.producto-creado`.

## 4. CRUD desde React (3 min)

1. Crear un producto (mostrar un error de validación antes: formulario vacío).
2. Editarlo y eliminarlo (pide confirmación). La lista se actualiza sola (`invalidateQueries`).
3. Mostrar el otro evento: `Invoke-RestMethod` a `http://localhost:8080/auth/me` con el token; `productsCreated` subió por el evento `producto.creado`.
4. Cerrar sesión: `/products` vuelve a pedir login.

## 5. Seguridad y pruebas (1 min)

1. Sin token: `POST /products` por el gateway responde **401** (mostrarlo con PowerShell o Thunder Client).
2. `npm test`: mostrar que corren los tests unitarios, de integración, de componentes y E2E.

## Preguntas probables en la defensa

| Pregunta | Idea de respuesta |
|---|---|
| ¿Por qué un API Gateway? | Una sola entrada para el frontend; los servicios no se exponen y se pueden mover sin tocar el frontend. |
| ¿Por qué cada servicio tiene su propia base? | Para que sean independientes: si compartieran el esquema, un cambio en uno rompería al otro. Por eso el catálogo guarda su propia copia mínima de los usuarios. |
| ¿Por qué RabbitMQ y no una llamada REST entre servicios? | El que publica no espera ni falla si el otro está caído. Si RabbitMQ falla, el registro igual se completa. |
| ¿Qué pasa si el auth-service se cae? | El catálogo sigue sirviendo: verifica el JWT por su cuenta. No se puede iniciar sesión hasta que vuelva. |
| ¿Qué limitaciones tiene? | Ver "Limitaciones conocidas" del README: consistencia eventual, evento perdido si RabbitMQ está caído al publicar, clave JWT compartida. |
| ¿Qué es la arquitectura hexagonal en tu proyecto? | La lógica (servicio) no depende de Express, Mongoose ni RabbitMQ; se le pasan desde `index.js`. Por eso se prueba con mocks. |
