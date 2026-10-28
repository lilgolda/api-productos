import amqp from "amqplib";
import { logger } from "../shared/logger.js";

const EXCHANGE = "eventos";
const QUEUE = "auth-service.producto-creado";
const RETRY_MS = 3000;

export function startProductoEventsConsumer({ url, service }) {
  async function connect() {
    let connection;
    try {
      connection = await amqp.connect(url);
      connection.on("error", () => {});
      const channel = await connection.createChannel();
      channel.on("error", () => {});

      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, "producto.creado");

      await channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          await service.registerProductCreated(event.createdBy);
          logger.info({ createdBy: event.createdBy, productId: event.productId }, "Evento producto.creado procesado");
          channel.ack(msg);
        } catch (err) {
          logger.error({ err }, "No se pudo procesar producto.creado");
          channel.nack(msg, false, false);
        }
      });

      connection.on("close", () => {
        logger.warn("RabbitMQ cerró la conexión, reintentando");
        setTimeout(connect, RETRY_MS);
      });
      logger.info("Escuchando eventos producto.creado");
    } catch (err) {
      logger.warn({ err: err.message }, "RabbitMQ no disponible, reintento en 3 s");
      if (connection) connection.close().catch(() => {});
      setTimeout(connect, RETRY_MS);
    }
  }

  connect();
}
