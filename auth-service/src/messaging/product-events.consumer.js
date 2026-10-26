import amqp from "amqplib";

const EXCHANGE = "products";
const QUEUE = "auth-service.product-created";
const RETRY_MS = 3000;

export function startProductEventsConsumer({ url, service }) {
  async function connect() {
    let connection;
    try {
      connection = await amqp.connect(url);
      connection.on("error", () => {});
      const channel = await connection.createChannel();
      channel.on("error", () => {});

      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, "product.created");

      await channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          await service.registerProductCreated(event.createdBy);
          channel.ack(msg);
        } catch (err) {
          console.error("No se pudo procesar product.created:", err.message);
          channel.nack(msg, false, false);
        }
      });

      connection.on("close", () => {
        console.error("RabbitMQ cerró la conexión, reintentando...");
        setTimeout(connect, RETRY_MS);
      });
      console.log("auth-service escuchando eventos product.created");
    } catch (err) {
      console.error(`RabbitMQ no disponible (${err.message}), reintento en 3 s`);
      if (connection) connection.close().catch(() => {});
      setTimeout(connect, RETRY_MS);
    }
  }

  connect();
}
