export const EVENT_PUBLISHER_PORT = 'EVENT_PUBLISHER_PORT';

export interface EventPublisherPort {
  publish(event: object, routingKey: string): Promise<void>;
}
