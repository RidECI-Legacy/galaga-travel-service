import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { MetricsInterceptor } from 'src/metrics/metrics.interceptor';
import { MetricsService } from 'src/metrics/metrics.service';

function buildContext(
  path: string,
  method = 'GET',
  routePath?: string,
  statusCode = 200,
): ExecutionContext {
  const req = {
    path,
    url: path,
    method,
    route: routePath ? { path: routePath } : undefined,
  };
  const res = { statusCode };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as any;
}

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let endTimer: jest.Mock;
  let metricsService: {
    httpRequestDuration: { startTimer: jest.Mock };
    httpRequestsTotal: { inc: jest.Mock };
  };

  beforeEach(async () => {
    endTimer = jest.fn();
    metricsService = {
      httpRequestDuration: { startTimer: jest.fn().mockReturnValue(endTimer) },
      httpRequestsTotal: { inc: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsInterceptor,
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
  });

  describe('intercept — /metrics paths (bypassed)', () => {
    it('should bypass tracking for the exact /metrics path', () => {
      const next: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      interceptor.intercept(buildContext('/metrics'), next);

      expect(metricsService.httpRequestDuration.startTimer).not.toHaveBeenCalled();
    });

    it('should bypass tracking for sub-paths under /metrics', () => {
      const next: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      interceptor.intercept(buildContext('/metrics/prometheus'), next);

      expect(metricsService.httpRequestDuration.startTimer).not.toHaveBeenCalled();
    });
  });

  describe('intercept — regular paths (tracked)', () => {
    it('should start a duration timer and increment the request counter on completion', (done) => {
      const context = buildContext('/travels', 'POST', '/travels', 201);
      const next: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      interceptor.intercept(context, next).subscribe({
        complete: () => {
          expect(metricsService.httpRequestDuration.startTimer).toHaveBeenCalledWith({
            method: 'POST',
            route: '/travels',
          });
          expect(endTimer).toHaveBeenCalled();
          expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith({
            method: 'POST',
            status: 201,
            route: '/travels',
          });
          done();
        },
      });
    });

    it('should fall back to req.url when no route path is defined', (done) => {
      const context = buildContext('/travels/abc-123', 'GET');
      const next: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      interceptor.intercept(context, next).subscribe({
        complete: () => {
          expect(metricsService.httpRequestDuration.startTimer).toHaveBeenCalledWith({
            method: 'GET',
            route: '/travels/abc-123',
          });
          done();
        },
      });
    });
  });
});
