import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from 'src/metrics/metrics.controller';
import { MetricsService } from 'src/metrics/metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  const mockMetricsOutput = '# HELP http_requests_total Total HTTP requests\n';
  const mockContentType = 'text/plain; version=0.0.4; charset=utf-8';

  let metricsService: { registry: { contentType: string; metrics: jest.Mock } };

  beforeEach(async () => {
    metricsService = {
      registry: {
        contentType: mockContentType,
        metrics: jest.fn().mockResolvedValue(mockMetricsOutput),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [{ provide: MetricsService, useValue: metricsService }],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  describe('getMetrics', () => {
    it('should set the Prometheus content-type header and write metrics to the response', async () => {
      const res = { set: jest.fn(), end: jest.fn() };

      await controller.getMetrics(res as any);

      expect(res.set).toHaveBeenCalledWith('Content-Type', mockContentType);
      expect(metricsService.registry.metrics).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(mockMetricsOutput);
    });
  });
});
