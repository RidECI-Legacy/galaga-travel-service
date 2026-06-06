import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Travel } from '../../domain/travel';
import { Status } from '../../domain/enums/status.enum';
import { TRAVEL_REPOSITORY_PORT } from '../ports/out/travel-repository.port';
import type { TravelRepositoryPort } from '../ports/out/travel-repository.port';
import { CreateTravelDto } from '../../infraestructure/controller/dto/create-travel.dto';

@Injectable()
export class TravelService {
  constructor(
    @Inject(TRAVEL_REPOSITORY_PORT)
    private readonly travelRepository: TravelRepositoryPort,
  ) {}

  async createTravel(dto: CreateTravelDto): Promise<Travel> {
    const travel: Travel = {
      organizerId: dto.organizerId,
      driverId: dto.driverId,
      availableSlots: dto.availableSlots,
      status: dto.status,
      travelType: dto.travelType,
      vehicleType: dto.vehicleType,
      estimatedCost: dto.estimatedCost,
      departureDateAndTime: new Date(dto.departureDateAndTime),
      passengersId: dto.passengersId ?? [],
      conditions: dto.conditions,
      origin: dto.origin,
      destination: dto.destination,
      durationMinutes: dto.durationMinutes,
    };
    return this.travelRepository.save(travel);
  }

  async getTravelById(id: string): Promise<Travel> {
    const travel = await this.travelRepository.findById(id);
    if (!travel) throw new NotFoundException(`Travel with id ${id} not found`);
    return travel;
  }

  async deleteTravelById(id: string): Promise<void> {
    return this.travelRepository.deleteById(id);
  }

  async updateTravel(id: string, dto: CreateTravelDto): Promise<Travel> {
    const travel: Travel = {
      id,
      organizerId: dto.organizerId,
      driverId: dto.driverId,
      availableSlots: dto.availableSlots,
      status: dto.status,
      travelType: dto.travelType,
      vehicleType: dto.vehicleType,
      estimatedCost: dto.estimatedCost,
      departureDateAndTime: new Date(dto.departureDateAndTime),
      passengersId: dto.passengersId ?? [],
      conditions: dto.conditions,
      origin: dto.origin,
      destination: dto.destination,
      durationMinutes: dto.durationMinutes,
    };
    return this.travelRepository.update(id, travel);
  }

  async getAllTravels(): Promise<Travel[]> {
    return this.travelRepository.findAll();
  }

  async changeStateTravel(id: string, status: Status): Promise<Travel> {
    return this.travelRepository.changeState(id, status);
  }

  async getPassengerList(id: string, passengersId: number[]): Promise<number[]> {
    return this.travelRepository.getPassengerList(id, passengersId);
  }

  async getAllTravelsByDriverId(driverId: number): Promise<Travel[]> {
    return this.travelRepository.findAllByDriverId(driverId);
  }

  async getAllTravelsByOrganizerId(organizerId: number): Promise<Travel[]> {
    return this.travelRepository.findAllByOrganizerId(organizerId);
  }

  async getAllTravelsByPassengerId(passengerId: number): Promise<Travel[]> {
    return this.travelRepository.findAllByPassengerId(passengerId);
  }

  async updatePassengers(id: string, passengersIds: number[]): Promise<void> {
    return this.travelRepository.updatePassengers(id, passengersIds);
  }

  async updateAvailableSlots(id: string, quantity: number): Promise<void> {
    return this.travelRepository.updateAvailableSlots(id, quantity);
  }
}
