import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import amqp from 'amqplib';
import type { EventPublisherPort } from '../../application/ports/out/event-publisher.port';

const EXCHANGE = 'travel.exchange';

const QUEUES = [
  { name: 'travel.created.queue', routingKey: 'travel.created' },
  { name: 'travel.updated.queue', routingKey: 'travel.updated' },
  { name: 'travel.completed.queue', routingKey: 'travel.completed' },
  { name: 'travel.cancelled.queue', routingKey: 'travel.cancelled' },
  { name: 'travel.passengers.updated.queue', routingKey: 'travel.passengers.updated' },
];

@Injectable()
export class RabbitEventPublisher implements EventPublisherPort, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitEventPublisher.name);
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL ?? 'amqp://localhost';
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      for (const { name, routingKey } of QUEUES) {
        await this.channel.assertQueue(name, { durable: true });
        await this.channel.bindQueue(name, EXCHANGE, routingKey);
      }
      this.logger.log('RabbitMQ connected and topology declared');
    } catch (err) {
      this.logger.warn(`RabbitMQ connection failed: ${(err as Error).message}. Events will be skipped.`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignore on shutdown
    }
  }

  async publish(event: object, routingKey: string): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ unavailable — skipping event [${routingKey}]`);
      return;
    }
    this.channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { contentType: 'application/json', persistent: true },
    );
  }
}

export { EVENT_PUBLISHER_PORT } from '../../application/ports/out/event-publisher.port';
