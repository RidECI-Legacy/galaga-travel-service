import { TravelMapper } from 'src/travels/infraestructure/persistence/travel.mapper';
import { Status } from 'src/travels/domain/enums/status.enum';
import { TravelType } from 'src/travels/domain/enums/travel-type.enum';
import { Travel } from 'src/travels/domain/travel';

const mockOrigin = { latitude: 4.6, longitude: -74.1, direction: 'Calle 1' };
const mockDest = { latitude: 4.7, longitude: -74.0, direction: 'Calle 2' };

function buildPrismaTravel(overrides: Partial<any> = {}): any {
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

function buildTravel(overrides: Partial<Travel> = {}): Travel {
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

describe('TravelMapper', () => {
  let mapper: TravelMapper;

  beforeEach(() => {
    mapper = new TravelMapper();
  });

  describe('toDomain', () => {
    it('should map all Prisma fields to a domain Travel', () => {
      const result = mapper.toDomain(buildPrismaTravel());

      expect(result.id).toBe('travel-1');
      expect(result.organizerId).toBe(1);
      expect(result.driverId).toBe(5);
      expect(result.availableSlots).toBe(3);
      expect(result.status).toBe(Status.CREATED);
      expect(result.travelType).toBe(TravelType.DAILY);
      expect(result.estimatedCost).toBe(15000);
      expect(result.passengersId).toEqual([2, 3]);
      expect(result.conditions).toBe('No smoking');
      expect(result.durationMinutes).toBe(25);
      expect(result.origin).toEqual(mockOrigin);
      expect(result.destination).toEqual(mockDest);
    });

    it('should convert BigInt organizerId and driverId to numbers', () => {
      const result = mapper.toDomain(buildPrismaTravel());

      expect(typeof result.organizerId).toBe('number');
      expect(typeof result.driverId).toBe('number');
    });

    it('should convert BigInt passengersId array to numbers', () => {
      const result = mapper.toDomain(buildPrismaTravel());

      result.passengersId.forEach((id) => expect(typeof id).toBe('number'));
      expect(result.passengersId).toEqual([2, 3]);
    });

    it('should set driverId to undefined when null in Prisma', () => {
      const result = mapper.toDomain(buildPrismaTravel({ driverId: null }));

      expect(result.driverId).toBeUndefined();
    });

    it('should set conditions to undefined when null in Prisma', () => {
      const result = mapper.toDomain(buildPrismaTravel({ conditions: null }));

      expect(result.conditions).toBeUndefined();
    });

    it('should set durationMinutes to undefined when null in Prisma', () => {
      const result = mapper.toDomain(buildPrismaTravel({ durationMinutes: null }));

      expect(result.durationMinutes).toBeUndefined();
    });
  });

  describe('toResponse', () => {
    it('should map all domain fields to a TravelResponseDto', () => {
      const travel = buildTravel();
      const result = mapper.toResponse(travel);

      expect(result.id).toBe('travel-1');
      expect(result.organizerId).toBe(1);
      expect(result.driverId).toBe(5);
      expect(result.availableSlots).toBe(3);
      expect(result.status).toBe(Status.CREATED);
      expect(result.travelType).toBe(TravelType.DAILY);
      expect(result.estimatedCost).toBe(15000);
      expect(result.passengersId).toEqual([2, 3]);
      expect(result.conditions).toBe('No smoking');
      expect(result.durationMinutes).toBe(25);
      expect(result.origin).toEqual(mockOrigin);
      expect(result.destination).toEqual(mockDest);
    });

    it('should preserve undefined optional fields', () => {
      const travel = buildTravel({ driverId: undefined, conditions: undefined, durationMinutes: undefined });
      const result = mapper.toResponse(travel);

      expect(result.driverId).toBeUndefined();
      expect(result.conditions).toBeUndefined();
      expect(result.durationMinutes).toBeUndefined();
    });
  });

  describe('toResponseList', () => {
    it('should map each travel in the array', () => {
      const travels = [buildTravel(), buildTravel({ id: 'travel-2', organizerId: 2 })];

      const result = mapper.toResponseList(travels);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('travel-1');
      expect(result[1].id).toBe('travel-2');
    });

    it('should return an empty array for an empty input', () => {
      expect(mapper.toResponseList([])).toEqual([]);
    });
  });
});
