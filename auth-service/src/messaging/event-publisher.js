import amqp from "amqplib";
import { logger } from "../shared/logger.js";

export function createEventPublisher({ url, exchange = "eventos" }) {
  let channel = null;
  let connecting = null;

  async function getChannel() {
    if (channel) return channel;
    if (!connecting) {
      connecting = (async () => {
        const connection = await amqp.connect(url);
        connection.on("error", () => {});
        connection.on("close", () => {
          channel = null;
        });
        const ch = await connection.createChannel();
        ch.on("error", () => {});
        ch.on("close", () => {
          channel = null;
        });
        await ch.assertExchange(exchange, "topic", { durable: true });
        channel = ch;
        logger.info("Conectado a RabbitMQ");
        return ch;
      })().finally(() => {
        connecting = null;
      });
    }
    return connecting;
  }

  return {
    async publish(routingKey, payload) {
      const ch = await getChannel();
      ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
        contentType: "application/json",
      });
    },
  };
}
