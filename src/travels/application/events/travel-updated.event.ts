import { Location } from '../../domain/location';

export class TravelUpdatedEvent {
  travelId: string;
  availableSlots: number;
  estimatedCost: number;
  departureDateAndTime: Date;
  origin: Location;
  destination: Location;
  passengersId: number[];
}
