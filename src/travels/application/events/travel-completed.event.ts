import { TravelType } from '../../domain/enums/travel-type.enum';

export class TravelCompletedEvent {
  id: string;
  organizerId: number;
  driverId?: number;
  // vehicleType: VehicleType; // TODO: reintroducir cuando el dominio vuelva a soportarlo
  travelType: TravelType;
  passengersId: number[];
  totalKm: number;
  tripName?: string;
}
