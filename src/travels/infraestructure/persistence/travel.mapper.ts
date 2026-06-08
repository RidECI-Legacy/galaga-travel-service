import { Injectable } from '@nestjs/common';
import { Travel as PrismaTravel } from '@prisma/client';
import { Travel } from '../../domain/travel';
import { Location } from '../../domain/location';
import { Status } from '../../domain/enums/status.enum';
import { TravelType } from '../../domain/enums/travel-type.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { TravelResponseDto } from '../controller/dto/travel-response.dto';

@Injectable()
export class TravelMapper {
  toDomain(prisma: PrismaTravel): Travel {
    return {
      id: prisma.id as string,
      organizerId: Number(prisma.organizerId),
      driverId: prisma.driverId == null ? undefined : Number(prisma.driverId),
      availableSlots: prisma.availableSlots,
      status: prisma.status as Status,
      travelType: prisma.travelType as TravelType,
      vehicleType: prisma.vehicleType as VehicleType,
      estimatedCost: prisma.estimatedCost,
      departureDateAndTime: prisma.departureDateAndTime,
      passengersId: prisma.passengersId.map(Number),
      conditions: prisma.conditions ?? undefined,
      origin: prisma.origin as Location,
      destination: prisma.destination as Location,
      durationMinutes: prisma.durationMinutes ?? undefined,
    };
  }

  toResponse(travel: Travel): TravelResponseDto {
    return {
      id: travel.id!,
      organizerId: travel.organizerId,
      driverId: travel.driverId,
      availableSlots: travel.availableSlots,
      status: travel.status,
      travelType: travel.travelType,
      vehicleType: travel.vehicleType,
      estimatedCost: travel.estimatedCost,
      departureDateAndTime: travel.departureDateAndTime,
      passengersId: travel.passengersId,
      conditions: travel.conditions,
      origin: travel.origin,
      destination: travel.destination,
      durationMinutes: travel.durationMinutes,
    };
  }

  toResponseList(travels: Travel[]): TravelResponseDto[] {
    return travels.map((t) => this.toResponse(t));
  }
}
