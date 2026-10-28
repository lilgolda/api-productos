import amqp from "amqplib";
import { logger } from "../shared/logger.js";

const EXCHANGE = "eventos";
const QUEUE = "catalog-service.usuario-creado";
const RETRY_MS = 3000;

export function startUsuarioEventsConsumer({ url, service }) {
  async function connect() {
    let connection;
    try {
      connection = await amqp.connect(url);
      connection.on("error", () => {});
      const channel = await connection.createChannel();
      channel.on("error", () => {});

      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, "usuario.creado");

      await channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          await service.recordUserCreated(event);
          channel.ack(msg);
        } catch (err) {
          logger.error({ err }, "No se pudo procesar usuario.creado");
          channel.nack(msg, false, false);
        }
      });

      connection.on("close", () => {
        logger.warn("RabbitMQ cerró la conexión, reintentando");
        setTimeout(connect, RETRY_MS);
      });
      logger.info("Escuchando eventos usuario.creado");
    } catch (err) {
      logger.warn({ err: err.message }, "RabbitMQ no disponible, reintento en 3 s");
      if (connection) connection.close().catch(() => {});
      setTimeout(connect, RETRY_MS);
    }
  }

  connect();
}
