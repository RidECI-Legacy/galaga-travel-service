import { Location } from '../../domain/location';
import { Status } from '../../domain/enums/status.enum';
import { TravelType } from '../../domain/enums/travel-type.enum';

export class TravelCreatedEvent {
  travelId: string;
  organizerId: number;
  driverId?: number;
  availableSlots: number;
  status: Status;
  travelType: TravelType;
  estimatedCost: number;
  departureDateAndTime: Date;
  passengersId: number[];
  conditions?: string;
  origin: Location;
  destination: Location;
}
