// Mock @prisma/client before any module import so ts-jest does not try to
// resolve the generated Prisma client that requires `prisma generate`.
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TravelRepositoryAdapter } from 'src/travels/infraestructure/persistence/travel-repository.adapter';
import { PrismaService } from 'src/travels/infraestructure/persistence/prisma/prisma.service';
import { TravelMapper } from 'src/travels/infraestructure/persistence/travel.mapper';
import { EVENT_PUBLISHER_PORT } from 'src/travels/application/ports/out/event-publisher.port';
import { Status } from 'src/travels/domain/enums/status.enum';
import { TravelType } from 'src/travels/domain/enums/travel-type.enum';
import { Travel } from 'src/travels/domain/travel';

const mockOrigin = { latitude: 4.6, longitude: -74.1, direction: 'Calle 1' };
const mockDest = { latitude: 4.7, longitude: -74.0, direction: 'Calle 2' };

function buildDomain(overrides: Partial<Travel> = {}): Travel {
  return {
    id: 'travel-1',
    organizerId: 1,
    driverId: 5,
    availableSlots: 3,
    status: Status.CREATED,
    travelType: TravelType.DAILY,
    estimatedCost: 15000,
    departureDateAndTime: new Date('2026-06-10T08:00:00.000Z'),
    passengersId: [2, 3],
    conditions: 'No smoking',
    origin: mockOrigin,
    destination: mockDest,
    durationMinutes: 25,
    ...overrides,
  };
}

function buildPrisma(overrides: Partial<any> = {}): any {
  return {
    id: 'travel-1',
    organizerId: BigInt(1),
    driverId: BigInt(5),
    availableSlots: 3,
    status: 'CREATED',
    travelType: 'DAILY',
    estimatedCost: 15000,
    departureDateAndTime: new Date('2026-06-10T08:00:00.000Z'),
    passengersId: [BigInt(2), BigInt(3)],
    conditions: 'No smoking',
    origin: mockOrigin,
    destination: mockDest,
    durationMinutes: 25,
    ...overrides,
  };
}

describe('TravelRepositoryAdapter', () => {
  let adapter: TravelRepositoryAdapter;
  let prisma: { travel: Record<string, jest.Mock> };
  let mapper: jest.Mocked<TravelMapper>;
  let eventPublisher: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      travel: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    mapper = {
      toDomain: jest.fn(),
      toResponse: jest.fn(),
      toResponseList: jest.fn(),
    } as any;
    eventPublisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelRepositoryAdapter,
        { provide: PrismaService, useValue: prisma },
        { provide: TravelMapper, useValue: mapper },
        { provide: EVENT_PUBLISHER_PORT, useValue: eventPublisher },
      ],
    }).compile();

    adapter = module.get<TravelRepositoryAdapter>(TravelRepositoryAdapter);
  });

  describe('save', () => {
    it('should persist the travel, publish travel.created and return the domain entity', async () => {
      const input = buildDomain({ id: undefined });
      const prismaRecord = buildPrisma();
      const domain = buildDomain();
      prisma.travel.create.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      const result = await adapter.save(input);

      expect(prisma.travel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizerId: BigInt(input.organizerId),
            availableSlots: input.availableSlots,
          }),
        }),
      );
      expect(mapper.toDomain).toHaveBeenCalledWith(prismaRecord);
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ travelId: domain.id }),
        'travel.created',
      );
      expect(result).toEqual(domain);
    });

    it('should pass null for driverId when not provided', async () => {
      const input = buildDomain({ driverId: undefined });
      prisma.travel.create.mockResolvedValue(buildPrisma({ driverId: null }));
      mapper.toDomain.mockReturnValue(buildDomain({ driverId: undefined }));

      await adapter.save(input);

      expect(prisma.travel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ driverId: null }),
        }),
      );
    });

    it('should publish travel.geolocation.created with idViaje and integrantes (driver + passengers)', async () => {
      const input = buildDomain({ id: undefined });
      const prismaRecord = buildPrisma();
      const domain = buildDomain({ driverId: 5, passengersId: [2, 3] });
      prisma.travel.create.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      await adapter.save(input);

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        { idViaje: domain.id, integrantes: [5, 2, 3] },
        'travel.geolocation.created',
      );
    });

    it('should publish integrantes with only passengers when there is no driver yet', async () => {
      const input = buildDomain({ id: undefined, driverId: undefined });
      const prismaRecord = buildPrisma({ driverId: null });
      const domain = buildDomain({ driverId: undefined, passengersId: [2, 3] });
      prisma.travel.create.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      await adapter.save(input);

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        { idViaje: domain.id, integrantes: [2, 3] },
        'travel.geolocation.created',
      );
    });
  });

  describe('findById', () => {
    it('should return the domain travel when found', async () => {
      const prismaRecord = buildPrisma();
      const domain = buildDomain();
      prisma.travel.findUnique.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      const result = await adapter.findById('travel-1');

      expect(prisma.travel.findUnique).toHaveBeenCalledWith({ where: { id: 'travel-1' } });
      expect(result).toEqual(domain);
    });

    it('should throw NotFoundException when the travel does not exist', async () => {
      prisma.travel.findUnique.mockResolvedValue(null);

      await expect(adapter.findById('missing-id')).rejects.toThrow(
        new NotFoundException('Travel with id missing-id not found'),
      );
    });
  });

  describe('deleteById', () => {
    it('should delete the travel and publish travel.cancelled event', async () => {
      prisma.travel.delete.mockResolvedValue(undefined);

      await adapter.deleteById('travel-1');

      expect(prisma.travel.delete).toHaveBeenCalledWith({ where: { id: 'travel-1' } });
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        { travelId: 'travel-1' },
        'travel.cancelled',
      );
    });
  });

  describe('update', () => {
    it('should update the travel, publish travel.updated and return the domain entity', async () => {
      const input = buildDomain();
      const prismaRecord = buildPrisma();
      const domain = buildDomain();
      prisma.travel.update.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      const result = await adapter.update('travel-1', input);

      expect(prisma.travel.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'travel-1' } }),
      );
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ travelId: 'travel-1' }),
        'travel.updated',
      );
      expect(result).toEqual(domain);
    });
  });

  describe('findAll', () => {
    it('should map and return all travels', async () => {
      const records = [buildPrisma(), buildPrisma({ id: 'travel-2' })];
      const domains = [buildDomain(), buildDomain({ id: 'travel-2' })];
      prisma.travel.findMany.mockResolvedValue(records);
      mapper.toDomain.mockReturnValueOnce(domains[0]).mockReturnValueOnce(domains[1]);

      const result = await adapter.findAll();

      expect(prisma.travel.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('travel-1');
      expect(result[1].id).toBe('travel-2');
    });

    it('should return an empty array when no travels exist', async () => {
      prisma.travel.findMany.mockResolvedValue([]);

      expect(await adapter.findAll()).toEqual([]);
    });
  });

  describe('changeState', () => {
    it('should update the status and return the domain entity without publishing for non-completed states', async () => {
      const prismaRecord = buildPrisma({ status: 'IN_PROGRESS' });
      const domain = buildDomain({ status: Status.IN_PROGRESS });
      prisma.travel.update.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      const result = await adapter.changeState('travel-1', Status.IN_PROGRESS);

      expect(prisma.travel.update).toHaveBeenCalledWith({
        where: { id: 'travel-1' },
        data: { status: Status.IN_PROGRESS },
      });
      expect(eventPublisher.publish).not.toHaveBeenCalled();
      expect(result).toEqual(domain);
    });

    it('should publish travel.completed event when status becomes COMPLETED', async () => {
      const prismaRecord = buildPrisma({ status: 'COMPLETED' });
      const domain = buildDomain({ status: Status.COMPLETED });
      prisma.travel.update.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      await adapter.changeState('travel-1', Status.COMPLETED);

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'travel-1',
          organizerId: domain.organizerId,
          travelType: domain.travelType,
          passengersId: domain.passengersId,
          totalKm: 0,
          tripName: `${domain.origin.direction} → ${domain.destination.direction}`,
        }),
        'travel.completed',
      );
    });
  });

  describe('getPassengerList', () => {
    it('should return the passengersId when the stored list matches the requested list', async () => {
      prisma.travel.findUnique.mockResolvedValue(
        buildPrisma({ passengersId: [BigInt(2), BigInt(3)] }),
      );

      const result = await adapter.getPassengerList('travel-1', [2, 3]);

      expect(result).toEqual([2, 3]);
    });

    it('should return an empty array when the lists differ', async () => {
      prisma.travel.findUnique.mockResolvedValue(
        buildPrisma({ passengersId: [BigInt(2), BigInt(3)] }),
      );

      const result = await adapter.getPassengerList('travel-1', [2, 99]);

      expect(result).toEqual([]);
    });

    it('should return an empty array when sizes differ', async () => {
      prisma.travel.findUnique.mockResolvedValue(
        buildPrisma({ passengersId: [BigInt(2), BigInt(3)] }),
      );

      const result = await adapter.getPassengerList('travel-1', [2]);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when the travel does not exist', async () => {
      prisma.travel.findUnique.mockResolvedValue(null);

      await expect(adapter.getPassengerList('missing-id', [2])).rejects.toThrow(
        new NotFoundException('Travel with id missing-id not found'),
      );
    });
  });

  describe('findAllByDriverId', () => {
    it('should query Prisma with BigInt driverId', async () => {
      prisma.travel.findMany.mockResolvedValue([buildPrisma()]);
      mapper.toDomain.mockReturnValue(buildDomain());

      const result = await adapter.findAllByDriverId(5);

      expect(prisma.travel.findMany).toHaveBeenCalledWith({ where: { driverId: BigInt(5) } });
      expect(result).toHaveLength(1);
    });
  });

  describe('findAllByOrganizerId', () => {
    it('should query Prisma with BigInt organizerId', async () => {
      prisma.travel.findMany.mockResolvedValue([buildPrisma()]);
      mapper.toDomain.mockReturnValue(buildDomain());

      await adapter.findAllByOrganizerId(1);

      expect(prisma.travel.findMany).toHaveBeenCalledWith({ where: { organizerId: BigInt(1) } });
    });
  });

  describe('findAllByPassengerId', () => {
    it('should query Prisma using the has filter with BigInt passengerId', async () => {
      prisma.travel.findMany.mockResolvedValue([buildPrisma()]);
      mapper.toDomain.mockReturnValue(buildDomain());

      await adapter.findAllByPassengerId(2);

      expect(prisma.travel.findMany).toHaveBeenCalledWith({
        where: { passengersId: { has: BigInt(2) } },
      });
    });
  });

  describe('updatePassengers', () => {
    it('should update passengers and publish travel.passengers.updated event', async () => {
      const prismaRecord = buildPrisma();
      const domain = buildDomain({ passengersId: [2, 3, 4] });
      prisma.travel.update.mockResolvedValue(prismaRecord);
      mapper.toDomain.mockReturnValue(domain);

      await adapter.updatePassengers('travel-1', [2, 3, 4]);

      expect(prisma.travel.update).toHaveBeenCalledWith({
        where: { id: 'travel-1' },
        data: { passengersId: [BigInt(2), BigInt(3), BigInt(4)] },
      });
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ travelId: 'travel-1', passengersId: [2, 3, 4] }),
        'travel.passengers.updated',
      );
    });
  });

  describe('updateAvailableSlots', () => {
    it('should compute the new slot count and update', async () => {
      prisma.travel.findUnique.mockResolvedValue(buildPrisma({ availableSlots: 3 }));
      prisma.travel.update.mockResolvedValue(undefined);

      await adapter.updateAvailableSlots('travel-1', -1);

      expect(prisma.travel.update).toHaveBeenCalledWith({
        where: { id: 'travel-1' },
        data: { availableSlots: 2 },
      });
    });

    it('should throw NotFoundException when the travel does not exist', async () => {
      prisma.travel.findUnique.mockResolvedValue(null);

      await expect(adapter.updateAvailableSlots('missing-id', -1)).rejects.toThrow(
        new NotFoundException('Travel with id missing-id not found'),
      );
    });
  });
});
