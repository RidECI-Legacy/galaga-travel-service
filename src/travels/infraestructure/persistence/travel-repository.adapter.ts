import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { TRAVEL_REPOSITORY_PORT } from '../../application/ports/out/travel-repository.port';
import type { TravelRepositoryPort } from '../../application/ports/out/travel-repository.port';
import { EVENT_PUBLISHER_PORT } from '../../application/ports/out/event-publisher.port';
import type { EventPublisherPort } from '../../application/ports/out/event-publisher.port';
import { Travel } from '../../domain/travel';
import { Status } from '../../domain/enums/status.enum';
import { TravelMapper } from './travel.mapper';
import { TravelCreatedEvent } from '../../application/events/travel-created.event';
import { TravelUpdatedEvent } from '../../application/events/travel-updated.event';
import { TravelCompletedEvent } from '../../application/events/travel-completed.event';
import { TravelCancelledEvent } from '../../application/events/travel-cancelled.event';

@Injectable()
export class TravelRepositoryAdapter implements TravelRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: TravelMapper,
    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async save(travel: Travel): Promise<Travel> {
    const saved = await this.prisma.travel.create({
      data: {
        organizerId: BigInt(travel.organizerId),
        driverId: travel.driverId == null ? null : BigInt(travel.driverId),
        availableSlots: travel.availableSlots,
        status: travel.status,
        travelType: travel.travelType,
        estimatedCost: travel.estimatedCost,
        departureDateAndTime: travel.departureDateAndTime,
        passengersId: (travel.passengersId ?? []).map(BigInt),
        conditions: travel.conditions,
        origin: travel.origin as any,
        destination: travel.destination as any,
        durationMinutes: travel.durationMinutes,
      },
    });

    const domain = this.mapper.toDomain(saved);

    const event: TravelCreatedEvent = {
      travelId: domain.id!,
      organizerId: domain.organizerId,
      driverId: domain.driverId,
      availableSlots: domain.availableSlots,
      status: domain.status,
      travelType: domain.travelType,
      estimatedCost: domain.estimatedCost,
      departureDateAndTime: domain.departureDateAndTime,
      passengersId: domain.passengersId,
      conditions: domain.conditions,
      origin: domain.origin,
      destination: domain.destination,
    };
    await this.eventPublisher.publish(event, 'travel.created');

    return domain;
  }

  async findById(id: string): Promise<Travel> {
    const travel = await this.prisma.travel.findUnique({ where: { id } });
    if (!travel) throw new NotFoundException(`Travel with id ${id} not found`);
    return this.mapper.toDomain(travel);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.travel.delete({ where: { id } });

    const event: TravelCancelledEvent = { travelId: id };
    await this.eventPublisher.publish(event, 'travel.cancelled');
  }

  async update(id: string, travel: Travel): Promise<Travel> {
    const updated = await this.prisma.travel.update({
      where: { id },
      data: {
        availableSlots: travel.availableSlots,
        estimatedCost: travel.estimatedCost,
        departureDateAndTime: travel.departureDateAndTime,
        passengersId: (travel.passengersId ?? []).map(BigInt),
        conditions: travel.conditions,
        origin: travel.origin as any,
        destination: travel.destination as any,
        durationMinutes: travel.durationMinutes,
      },
    });

    const domain = this.mapper.toDomain(updated);

    const event: TravelUpdatedEvent = {
      travelId: id,
      availableSlots: domain.availableSlots,
      estimatedCost: domain.estimatedCost,
      departureDateAndTime: domain.departureDateAndTime,
      origin: domain.origin,
      destination: domain.destination,
      passengersId: domain.passengersId,
    };
    await this.eventPublisher.publish(event, 'travel.updated');

    return domain;
  }

  async findAll(): Promise<Travel[]> {
    const travels = await this.prisma.travel.findMany();
    return travels.map((t) => this.mapper.toDomain(t));
  }

  async changeState(id: string, status: Status): Promise<Travel> {
    const updated = await this.prisma.travel.update({
      where: { id },
      data: { status },
    });

    const domain = this.mapper.toDomain(updated);

    if (status === Status.COMPLETED) {
      const event: TravelCompletedEvent = {
        id: domain.id!,
        organizerId: domain.organizerId,
        driverId: domain.driverId,
        // vehicleType: domain.vehicleType, me lo envia bob
        travelType: domain.travelType,
        passengersId: domain.passengersId,
        totalKm: 0, // me lo envia bob
        tripName: `${domain.origin.direction} → ${domain.destination.direction}`,
      };
      await this.eventPublisher.publish(event, 'travel.completed');
    }

    return domain;
  }

  async getPassengerList(id: string, passengersId: number[]): Promise<number[]> {
    const travel = await this.prisma.travel.findUnique({ where: { id } });
    if (!travel) throw new NotFoundException(`Travel with id ${id} not found`);

    const storedIds = new Set(travel.passengersId.map(String));
    const requestIds = new Set(passengersId.map(String));
    const equal = storedIds.size === requestIds.size && [...storedIds].every((v) => requestIds.has(v));

    return equal ? passengersId : [];
  }

  async findAllByDriverId(driverId: number): Promise<Travel[]> {
    const travels = await this.prisma.travel.findMany({
      where: { driverId: BigInt(driverId) },
    });
    return travels.map((t) => this.mapper.toDomain(t));
  }

  async findAllByOrganizerId(organizerId: number): Promise<Travel[]> {
    const travels = await this.prisma.travel.findMany({
      where: { organizerId: BigInt(organizerId) },
    });
    return travels.map((t) => this.mapper.toDomain(t));
  }

  async findAllByPassengerId(passengerId: number): Promise<Travel[]> {
    const travels = await this.prisma.travel.findMany({
      where: { passengersId: { has: BigInt(passengerId) } },
    });
    return travels.map((t) => this.mapper.toDomain(t));
  }

  async updatePassengers(id: string, passengersIds: number[]): Promise<void> {
    const updated = await this.prisma.travel.update({
      where: { id },
      data: { passengersId: passengersIds.map(BigInt) },
    });

    const domain = this.mapper.toDomain(updated);

    const event: TravelUpdatedEvent = {
      travelId: id,
      availableSlots: domain.availableSlots,
      estimatedCost: domain.estimatedCost,
      departureDateAndTime: domain.departureDateAndTime,
      origin: domain.origin,
      destination: domain.destination,
      passengersId: domain.passengersId,
    };
    await this.eventPublisher.publish(event, 'travel.passengers.updated');
  }

  async updateAvailableSlots(id: string, quantity: number): Promise<void> {
    const travel = await this.prisma.travel.findUnique({ where: { id } });
    if (!travel) throw new NotFoundException(`Travel with id ${id} not found`);

    await this.prisma.travel.update({
      where: { id },
      data: { availableSlots: travel.availableSlots + quantity },
    });
  }
}

export { TRAVEL_REPOSITORY_PORT } from '../../application/ports/out/travel-repository.port';
