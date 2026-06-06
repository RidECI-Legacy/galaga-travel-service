import { Status } from '../../domain/enums/status.enum';
import { TravelType } from '../../domain/enums/travel-type.enum';

export class TravelCompletedEvent {
  travelId: string;
  driverId?: number;
  organizerId: number;
  travelType: TravelType;
  departureDateAndTime: Date;
  passengerList: number[];
  state: Status;
}
