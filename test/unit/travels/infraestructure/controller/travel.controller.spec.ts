import { Test, TestingModule } from '@nestjs/testing';
import { TravelController } from 'src/travels/infraestructure/controller/travel.controller';
import { TravelService } from 'src/travels/application/service/travel.service';
import { TravelMapper } from 'src/travels/infraestructure/persistence/travel.mapper';
import { Status } from 'src/travels/domain/enums/status.enum';
import { TravelType } from 'src/travels/domain/enums/travel-type.enum';
import { VehicleType } from 'src/travels/domain/enums/vehicle-type.enum';
import { Travel } from 'src/travels/domain/travel';
import { TravelResponseDto } from 'src/travels/infraestructure/controller/dto/travel-response.dto';
import { CreateTravelDto } from 'src/travels/infraestructure/controller/dto/create-travel.dto';

const mockOrigin = { latitude: 4.6, longitude: -74.1, direction: 'Calle 1' };
const mockDest = { latitude: 4.7, longitude: -74.0, direction: 'Calle 2' };

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
    destination: mockDest,
    durationMinutes: 25,
    ...overrides,
  };
}

function buildResponse(overrides: Partial<TravelResponseDto> = {}): TravelResponseDto {
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
    destination: mockDest,
    durationMinutes: 25,
    ...overrides,
  };
}

function buildDto(): CreateTravelDto {
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
    destination: mockDest,
    durationMinutes: 25,
  };
}

describe('TravelController', () => {
  let controller: TravelController;
  let travelService: jest.Mocked<TravelService>;
  let travelMapper: jest.Mocked<TravelMapper>;

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<TravelService>> = {
      createTravel: jest.fn(),
      updateTravel: jest.fn(),
      getAllTravels: jest.fn(),
      getAllTravelsByDriverId: jest.fn(),
      getAllTravelsByOrganizerId: jest.fn(),
      getAllTravelsByPassengerId: jest.fn(),
      getPassengerList: jest.fn(),
      getTravelById: jest.fn(),
      deleteTravelById: jest.fn(),
      changeStateTravel: jest.fn(),
      updateAvailableSlots: jest.fn(),
      updatePassengers: jest.fn(),
    };
    const mockMapper: Partial<jest.Mocked<TravelMapper>> = {
      toResponse: jest.fn(),
      toResponseList: jest.fn(),
      toDomain: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelController],
      providers: [
        { provide: TravelService, useValue: mockService },
        { provide: TravelMapper, useValue: mockMapper },
      ],
    }).compile();

    controller = module.get<TravelController>(TravelController);
    travelService = module.get(TravelService);
    travelMapper = module.get(TravelMapper);
  });

  describe('createTravel', () => {
    it('should create a travel and return the response DTO', async () => {
      const dto = buildDto();
      const travel = buildTravel();
      const response = buildResponse();
      travelService.createTravel.mockResolvedValue(travel);
      travelMapper.toResponse.mockReturnValue(response);

      const result = await controller.createTravel(dto);

      expect(travelService.createTravel).toHaveBeenCalledWith(dto);
      expect(travelMapper.toResponse).toHaveBeenCalledWith(travel);
      expect(result).toEqual(response);
    });
  });

  describe('updateTravel', () => {
    it('should update a travel and return the response DTO', async () => {
      const dto = buildDto();
      const travel = buildTravel();
      const response = buildResponse();
      travelService.updateTravel.mockResolvedValue(travel);
      travelMapper.toResponse.mockReturnValue(response);

      const result = await controller.updateTravel('travel-1', dto);

      expect(travelService.updateTravel).toHaveBeenCalledWith('travel-1', dto);
      expect(travelMapper.toResponse).toHaveBeenCalledWith(travel);
      expect(result).toEqual(response);
    });
  });

  describe('getAllTravels', () => {
    it('should return a list of travel response DTOs', async () => {
      const travels = [buildTravel(), buildTravel({ id: 'travel-2' })];
      const responses = [buildResponse(), buildResponse({ id: 'travel-2' })];
      travelService.getAllTravels.mockResolvedValue(travels);
      travelMapper.toResponseList.mockReturnValue(responses);

      const result = await controller.getAllTravels();

      expect(travelService.getAllTravels).toHaveBeenCalled();
      expect(travelMapper.toResponseList).toHaveBeenCalledWith(travels);
      expect(result).toEqual(responses);
    });

    it('should return an empty array when no travels exist', async () => {
      travelService.getAllTravels.mockResolvedValue([]);
      travelMapper.toResponseList.mockReturnValue([]);

      expect(await controller.getAllTravels()).toEqual([]);
    });
  });

  describe('getAllTravelsByDriverId', () => {
    it('should parse the driverId string and return matching travels', async () => {
      const travels = [buildTravel()];
      const responses = [buildResponse()];
      travelService.getAllTravelsByDriverId.mockResolvedValue(travels);
      travelMapper.toResponseList.mockReturnValue(responses);

      const result = await controller.getAllTravelsByDriverId('5');

      expect(travelService.getAllTravelsByDriverId).toHaveBeenCalledWith(5);
      expect(result).toEqual(responses);
    });
  });

  describe('getAllTravelsByOrganizerId', () => {
    it('should parse the organizerId string and return matching travels', async () => {
      const travels = [buildTravel()];
      const responses = [buildResponse()];
      travelService.getAllTravelsByOrganizerId.mockResolvedValue(travels);
      travelMapper.toResponseList.mockReturnValue(responses);

      const result = await controller.getAllTravelsByOrganizerId('1');

      expect(travelService.getAllTravelsByOrganizerId).toHaveBeenCalledWith(1);
      expect(result).toEqual(responses);
    });
  });

  describe('getAllTravelsByPassengerId', () => {
    it('should parse the passengerId string and return matching travels', async () => {
      const travels = [buildTravel()];
      const responses = [buildResponse()];
      travelService.getAllTravelsByPassengerId.mockResolvedValue(travels);
      travelMapper.toResponseList.mockReturnValue(responses);

      const result = await controller.getAllTravelsByPassengerId('2');

      expect(travelService.getAllTravelsByPassengerId).toHaveBeenCalledWith(2);
      expect(result).toEqual(responses);
    });
  });

  describe('getPassengerList', () => {
    it('should return matching passenger ids', async () => {
      travelService.getPassengerList.mockResolvedValue([2, 3]);

      const result = await controller.getPassengerList('travel-1', [2, 3]);

      expect(travelService.getPassengerList).toHaveBeenCalledWith('travel-1', [2, 3]);
      expect(result).toEqual([2, 3]);
    });

    it('should return empty array when passengers do not match', async () => {
      travelService.getPassengerList.mockResolvedValue([]);

      expect(await controller.getPassengerList('travel-1', [99])).toEqual([]);
    });
  });

  describe('getTravelById', () => {
    it('should return the response DTO for the requested travel', async () => {
      const travel = buildTravel();
      const response = buildResponse();
      travelService.getTravelById.mockResolvedValue(travel);
      travelMapper.toResponse.mockReturnValue(response);

      const result = await controller.getTravelById('travel-1');

      expect(travelService.getTravelById).toHaveBeenCalledWith('travel-1');
      expect(result).toEqual(response);
    });
  });

  describe('deleteTravelById', () => {
    it('should call the service to delete the travel', async () => {
      travelService.deleteTravelById.mockResolvedValue(undefined);

      await controller.deleteTravelById('travel-1');

      expect(travelService.deleteTravelById).toHaveBeenCalledWith('travel-1');
    });
  });

  describe('changeStateTravel', () => {
    it('should change state and return the updated response DTO', async () => {
      const travel = buildTravel({ status: Status.IN_PROGRESS });
      const response = buildResponse({ status: Status.IN_PROGRESS });
      travelService.changeStateTravel.mockResolvedValue(travel);
      travelMapper.toResponse.mockReturnValue(response);

      const result = await controller.changeStateTravel('travel-1', Status.IN_PROGRESS);

      expect(travelService.changeStateTravel).toHaveBeenCalledWith('travel-1', Status.IN_PROGRESS);
      expect(result).toEqual(response);
    });
  });

  describe('updateAvailableSlots', () => {
    it('should call the service to update the available slots', async () => {
      travelService.updateAvailableSlots.mockResolvedValue(undefined);

      await controller.updateAvailableSlots('travel-1', -1);

      expect(travelService.updateAvailableSlots).toHaveBeenCalledWith('travel-1', -1);
    });
  });

  describe('updatePassengers', () => {
    it('should call the service to update the passenger list', async () => {
      travelService.updatePassengers.mockResolvedValue(undefined);

      await controller.updatePassengers('travel-1', [2, 3, 4]);

      expect(travelService.updatePassengers).toHaveBeenCalledWith('travel-1', [2, 3, 4]);
    });
  });
});
