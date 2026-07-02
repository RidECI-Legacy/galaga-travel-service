import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '../../../domain/enums/status.enum';
import { TravelType } from '../../../domain/enums/travel-type.enum';
import { LocationDto } from './location.dto';

export class CreateTravelDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  organizerId: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  driverId?: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  availableSlots: number;

  @ApiProperty({ enum: Status, example: Status.CREATED })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ enum: TravelType, example: TravelType.DAILY })
  @IsEnum(TravelType)
  travelType: TravelType;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  estimatedCost: number;

  @ApiProperty({ example: '2026-06-10T08:00:00.000Z' })
  @IsDateString()
  departureDateAndTime: string;

  @ApiPropertyOptional({ type: [Number], example: [2, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  passengersId?: number[];

  @ApiPropertyOptional({ example: 'No fumar, traer tapabocas' })
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;
}
