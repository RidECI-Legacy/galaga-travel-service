import { MetricsService } from 'src/metrics/metrics.service';

jest.mock('prom-client', () => ({
  Registry: jest.fn().mockImplementation(() => ({
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    metrics: jest.fn().mockResolvedValue('# HELP http_requests_total Total HTTP requests\n'),
  })),
  Counter: jest.fn().mockImplementation(() => ({ inc: jest.fn() })),
  Histogram: jest.fn().mockImplementation(() => ({
    startTimer: jest.fn().mockReturnValue(jest.fn()),
  })),
  collectDefaultMetrics: jest.fn(),
}));

describe('MetricsService', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const promClient = require('prom-client');
 
  beforeEach(() => jest.clearAllMocks());

  it('should instantiate a Prometheus Registry', () => {
    new MetricsService();
    expect(promClient.Registry).toHaveBeenCalledTimes(1);
  });

  it('should register default system metrics', () => {
    new MetricsService();
    expect(promClient.collectDefaultMetrics).toHaveBeenCalledTimes(1);
  });

  it('should create the httpRequestsTotal counter with correct labels', () => {
    new MetricsService();
    expect(promClient.Counter).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'http_requests_total',
        labelNames: expect.arrayContaining(['method', 'status', 'route']),
      }),
    );
  });

  it('should create the httpRequestDuration histogram with correct labels', () => {
    new MetricsService();
    expect(promClient.Histogram).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'http_request_duration_seconds',
        labelNames: expect.arrayContaining(['method', 'route']),
      }),
    );
  });

  it('should expose registry, httpRequestsTotal, and httpRequestDuration as public properties', () => {
    const service = new MetricsService();
    expect(service.registry).toBeDefined();
    expect(service.httpRequestsTotal).toBeDefined();
    expect(service.httpRequestDuration).toBeDefined();
  });
});
