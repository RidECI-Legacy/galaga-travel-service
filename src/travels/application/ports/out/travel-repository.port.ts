import { Travel } from '../../../domain/travel';
import { Status } from '../../../domain/enums/status.enum';

export const TRAVEL_REPOSITORY_PORT = 'TRAVEL_REPOSITORY_PORT';

export interface TravelRepositoryPort {
  save(travel: Travel): Promise<Travel>;
  findById(id: string): Promise<Travel>;
  deleteById(id: string): Promise<void>;
  update(id: string, travel: Travel): Promise<Travel>;
  findAll(): Promise<Travel[]>;
  changeState(id: string, status: Status): Promise<Travel>;
  getPassengerList(id: string, passengersId: number[]): Promise<number[]>;
  findAllByDriverId(driverId: number): Promise<Travel[]>;
  findAllByOrganizerId(organizerId: number): Promise<Travel[]>;
  findAllByPassengerId(passengerId: number): Promise<Travel[]>;
  updatePassengers(id: string, passengersIds: number[]): Promise<void>;
  updateAvailableSlots(id: string, quantity: number): Promise<void>;
}
