import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TravelService } from './travel.service';
import { TRAVEL_REPOSITORY_PORT } from '../ports/out/travel-repository.port';
import { Status } from '../../domain/enums/status.enum';
import { TravelType } from '../../domain/enums/travel-type.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { Travel } from '../../domain/travel';
import { CreateTravelDto } from '../../infraestructure/controller/dto/create-travel.dto';

const mockOrigin = { latitude: 4.6, longitude: -74.1, direction: 'Calle 1' };
const mockDestination = { latitude: 4.7, longitude: -74.0, direction: 'Calle 2' };

function buildDto(overrides: Partial<CreateTravelDto> = {}): CreateTravelDto {
  return {
    organizerId: 1,
    driverId: 5,
    availableSlots: 3,
    status: Status.CREATED,
    travelType: TravelType.DAILY,
    vehicleType: VehicleType.CAR,
    estimatedCost: 15000,
    departureDateAndTime: '2026-06-10T08:00:00.000Z',
    passengersId: [2, 3],
    conditions: 'No smoking',
    origin: mockOrigin,
    destination: mockDestination,
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
    vehicleType: VehicleType.CAR,
    estimatedCost: 15000,
    departureDateAndTime: new Date('2026-06-10T08:00:00.000Z'),
    passengersId: [2, 3],
    conditions: 'No smoking',
    origin: mockOrigin,
    destination: mockDestination,
    durationMinutes: 25,
    ...overrides,
  };
}

describe('TravelService', () => {
  let service: TravelService;
  let repository: Record<string, jest.Mock>;

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      changeState: jest.fn(),
      getPassengerList: jest.fn(),
      findAllByDriverId: jest.fn(),
      findAllByOrganizerId: jest.fn(),
      findAllByPassengerId: jest.fn(),
      updatePassengers: jest.fn(),
      updateAvailableSlots: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelService,
        { provide: TRAVEL_REPOSITORY_PORT, useValue: repository },
      ],
    }).compile();

    service = module.get<TravelService>(TravelService);
  });

  describe('createTravel', () => {
    it('should build a Travel from the DTO and save it', async () => {
      const dto = buildDto();
      const saved = buildTravel();
      repository.save.mockResolvedValue(saved);

      const result = await service.createTravel(dto);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          organizerId: dto.organizerId,
          driverId: dto.driverId,
          availableSlots: dto.availableSlots,
          status: dto.status,
          departureDateAndTime: new Date(dto.departureDateAndTime),
          passengersId: dto.passengersId,
        }),
      );
      expect(result).toEqual(saved);
    });

    it('should default passengersId to [] when not provided', async () => {
      const dto = buildDto({ passengersId: undefined });
      repository.save.mockResolvedValue(buildTravel({ passengersId: [] }));

      await service.createTravel(dto);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ passengersId: [] }),
      );
    });
  });

  describe('getTravelById', () => {
    it('should return the travel when found', async () => {
      const travel = buildTravel();
      repository.findById.mockResolvedValue(travel);

      const result = await service.getTravelById('travel-1');

      expect(repository.findById).toHaveBeenCalledWith('travel-1');
      expect(result).toEqual(travel);
    });

    it('should throw NotFoundException when travel does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getTravelById('missing-id')).rejects.toThrow(
        new NotFoundException('Travel with id missing-id not found'),
      );
    });
  });

  describe('deleteTravelById', () => {
    it('should delegate deletion to the repository', async () => {
      repository.deleteById.mockResolvedValue(undefined);

      await service.deleteTravelById('travel-1');

      expect(repository.deleteById).toHaveBeenCalledWith('travel-1');
    });
  });

  describe('updateTravel', () => {
    it('should build a Travel with the given id and call update', async () => {
      const dto = buildDto();
      const updated = buildTravel();
      repository.update.mockResolvedValue(updated);

      const result = await service.updateTravel('travel-1', dto);

      expect(repository.update).toHaveBeenCalledWith(
        'travel-1',
        expect.objectContaining({ id: 'travel-1', organizerId: dto.organizerId }),
      );
      expect(result).toEqual(updated);
    });

    it('should default passengersId to [] when not provided in update', async () => {
      const dto = buildDto({ passengersId: undefined });
      repository.update.mockResolvedValue(buildTravel({ passengersId: [] }));

      await service.updateTravel('travel-1', dto);

      expect(repository.update).toHaveBeenCalledWith(
        'travel-1',
        expect.objectContaining({ passengersId: [] }),
      );
    });
  });

  describe('getAllTravels', () => {
    it('should return all travels from the repository', async () => {
      const travels = [buildTravel(), buildTravel({ id: 'travel-2' })];
      repository.findAll.mockResolvedValue(travels);

      const result = await service.getAllTravels();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(travels);
    });

    it('should return an empty list when no travels exist', async () => {
      repository.findAll.mockResolvedValue([]);

      expect(await service.getAllTravels()).toEqual([]);
    });
  });

  describe('changeStateTravel', () => {
    it('should delegate state change to the repository', async () => {
      const updated = buildTravel({ status: Status.IN_PROGRESS });
      repository.changeState.mockResolvedValue(updated);

      const result = await service.changeStateTravel('travel-1', Status.IN_PROGRESS);

      expect(repository.changeState).toHaveBeenCalledWith('travel-1', Status.IN_PROGRESS);
      expect(result).toEqual(updated);
    });
  });

  describe('getPassengerList', () => {
    it('should return the passenger list from the repository', async () => {
      repository.getPassengerList.mockResolvedValue([2, 3]);

      const result = await service.getPassengerList('travel-1', [2, 3]);

      expect(repository.getPassengerList).toHaveBeenCalledWith('travel-1', [2, 3]);
      expect(result).toEqual([2, 3]);
    });
  });

  describe('getAllTravelsByDriverId', () => {
    it('should delegate to repository with the driver id', async () => {
      const travels = [buildTravel()];
      repository.findAllByDriverId.mockResolvedValue(travels);

      const result = await service.getAllTravelsByDriverId(5);

      expect(repository.findAllByDriverId).toHaveBeenCalledWith(5);
      expect(result).toEqual(travels);
    });
  });

  describe('getAllTravelsByOrganizerId', () => {
    it('should delegate to repository with the organizer id', async () => {
      const travels = [buildTravel()];
      repository.findAllByOrganizerId.mockResolvedValue(travels);

      const result = await service.getAllTravelsByOrganizerId(1);

      expect(repository.findAllByOrganizerId).toHaveBeenCalledWith(1);
      expect(result).toEqual(travels);
    });
  });

  describe('getAllTravelsByPassengerId', () => {
    it('should delegate to repository with the passenger id', async () => {
      const travels = [buildTravel()];
      repository.findAllByPassengerId.mockResolvedValue(travels);

      const result = await service.getAllTravelsByPassengerId(2);

      expect(repository.findAllByPassengerId).toHaveBeenCalledWith(2);
      expect(result).toEqual(travels);
    });
  });

  describe('updatePassengers', () => {
    it('should delegate passengers update to the repository', async () => {
      repository.updatePassengers.mockResolvedValue(undefined);

      await service.updatePassengers('travel-1', [2, 3, 4]);

      expect(repository.updatePassengers).toHaveBeenCalledWith('travel-1', [2, 3, 4]);
    });
  });

  describe('updateAvailableSlots', () => {
    it('should delegate slots update to the repository', async () => {
      repository.updateAvailableSlots.mockResolvedValue(undefined);

      await service.updateAvailableSlots('travel-1', -1);

      expect(repository.updateAvailableSlots).toHaveBeenCalledWith('travel-1', -1);
    });
  });
});
