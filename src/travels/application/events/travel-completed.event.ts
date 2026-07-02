import { TravelType } from '../../domain/enums/travel-type.enum';

export class TravelCompletedEvent {
  id: string;
  organizerId: number;
  driverId?: number;
  // vehicleType: VehicleType; Me lo envia bob
  travelType: TravelType;
  passengersId: number[];
  totalKm: number;
  tripName?: string;
}
