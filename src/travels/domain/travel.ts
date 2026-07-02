import { Location } from './location';
import { Status } from './enums/status.enum';
import { TravelType } from './enums/travel-type.enum';

export class Travel {
  id?: string;
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
  durationMinutes?: number;
}
