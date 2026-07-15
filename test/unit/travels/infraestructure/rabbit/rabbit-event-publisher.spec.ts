import { RabbitEventPublisher } from 'src/travels/infraestructure/rabbit/rabbit-event-publisher';

jest.mock('amqplib', () => {
  const channel = {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    bindQueue: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const connection = {
    createChannel: jest.fn().mockResolvedValue(channel),
    close: jest.fn().mockResolvedValue(undefined),
  };
  return {
    __esModule: true,
    default: { connect: jest.fn().mockResolvedValue(connection) },
  };
});

// Retrieve the mocked module after the factory has been registered.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const amqpMock = require('amqplib');

describe('RabbitEventPublisher', () => {
  let publisher: RabbitEventPublisher;

  beforeEach(() => {
    jest.clearAllMocks();
    publisher = new RabbitEventPublisher();
  });

  describe('onModuleInit', () => {
    it('should connect and assert exchange plus all seven queues', async () => {
      await publisher.onModuleInit();

      const mockConnection = await amqpMock.default.connect.mock.results[0].value;
      const mockChannel = await mockConnection.createChannel.mock.results[0].value;

      expect(amqpMock.default.connect).toHaveBeenCalledTimes(1);
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'travel.exchange',
        'topic',
        { durable: true },
      );
      expect(mockChannel.assertQueue).toHaveBeenCalledTimes(7);
      expect(mockChannel.bindQueue).toHaveBeenCalledTimes(7);
    });

    it('should log a warning and not throw when RabbitMQ connection fails', async () => {
      amqpMock.default.connect.mockRejectedValueOnce(new Error('Connection refused'));
      const warnSpy = jest.spyOn((publisher as any).logger, 'warn').mockImplementation(() => {});

      await expect(publisher.onModuleInit()).resolves.not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should publish the serialised event to the exchange when channel is ready', async () => {
      const mockChannel = {
        assertExchange: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn(),
        close: jest.fn(),
      };
      (publisher as any).channel = mockChannel;

      const event = { travelId: 'travel-1', organizerId: 1 };
      await publisher.publish(event, 'travel.created');

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'travel.exchange',
        'travel.created',
        Buffer.from(JSON.stringify(event)),
        { contentType: 'application/json', persistent: true },
      );
    });

    it('should log a warning and skip publishing when channel is not available', async () => {
      (publisher as any).channel = undefined;
      const warnSpy = jest.spyOn((publisher as any).logger, 'warn').mockImplementation(() => {});

      await publisher.publish({ travelId: 'travel-1' }, 'travel.created');

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close channel and connection on shutdown', async () => {
      const mockChannel = { close: jest.fn().mockResolvedValue(undefined) };
      const mockConnection = { close: jest.fn().mockResolvedValue(undefined) };
      (publisher as any).channel = mockChannel;
      (publisher as any).connection = mockConnection;

      await publisher.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should not throw when channel and connection were never initialised', async () => {
      (publisher as any).channel = undefined;
      (publisher as any).connection = undefined;

      await expect(publisher.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
