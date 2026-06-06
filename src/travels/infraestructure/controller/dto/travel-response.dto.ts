import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '../../../domain/enums/status.enum';
import { TravelType } from '../../../domain/enums/travel-type.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';
import { LocationDto } from './location.dto';

export class TravelResponseDto {
  @ApiProperty({ example: 'clxyz123abc' })
  id: string;

  @ApiProperty({ example: 1 })
  organizerId: number;

  @ApiPropertyOptional({ example: 5 })
  driverId?: number;

  @ApiProperty({ example: 3 })
  availableSlots: number;

  @ApiProperty({ enum: Status, example: Status.CREATED })
  status: Status;

  @ApiProperty({ enum: TravelType, example: TravelType.DAILY })
  travelType: TravelType;

  @ApiProperty({ enum: VehicleType, example: VehicleType.CAR })
  vehicleType: VehicleType;

  @ApiProperty({ example: 15000 })
  estimatedCost: number;

  @ApiProperty({ example: '2026-06-10T08:00:00.000Z' })
  departureDateAndTime: Date;

  @ApiProperty({ type: [Number], example: [2, 3] })
  passengersId: number[];

  @ApiPropertyOptional({ example: 'No fumar, traer tapabocas' })
  conditions?: string;

  @ApiProperty({ type: LocationDto })
  origin: LocationDto;

  @ApiProperty({ type: LocationDto })
  destination: LocationDto;

  @ApiPropertyOptional({ example: 25 })
  durationMinutes?: number;
}
