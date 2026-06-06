import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { TravelService } from '../../application/service/travel.service';
import { TravelMapper } from '../persistence/travel.mapper';
import { CreateTravelDto } from './dto/create-travel.dto';
import { TravelResponseDto } from './dto/travel-response.dto';
import { Status } from '../../domain/enums/status.enum';

@ApiTags('Travels')
@Controller('travels')
export class TravelController {
  constructor(
    private readonly travelService: TravelService,
    private readonly travelMapper: TravelMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un viaje' })
  @ApiResponse({ status: 201, type: TravelResponseDto })
  async createTravel(@Body() dto: CreateTravelDto): Promise<TravelResponseDto> {
    const travel = await this.travelService.createTravel(dto);
    return this.travelMapper.toResponse(travel);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un viaje' })
  @ApiParam({ name: 'id', description: 'ID del viaje' })
  @ApiResponse({ status: 200, type: TravelResponseDto })
  async updateTravel(
    @Param('id') id: string,
    @Body() dto: CreateTravelDto,
  ): Promise<TravelResponseDto> {
    const travel = await this.travelService.updateTravel(id, dto);
    return this.travelMapper.toResponse(travel);
  }

  @Get('all')
  @ApiOperation({ summary: 'Listar todos los viajes' })
  @ApiResponse({ status: 200, type: [TravelResponseDto] })
  async getAllTravels(): Promise<TravelResponseDto[]> {
    const travels = await this.travelService.getAllTravels();
    return this.travelMapper.toResponseList(travels);
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Viajes por conductor' })
  @ApiParam({ name: 'driverId', description: 'ID del conductor' })
  @ApiResponse({ status: 200, type: [TravelResponseDto] })
  async getAllTravelsByDriverId(@Param('driverId') driverId: string): Promise<TravelResponseDto[]> {
    const travels = await this.travelService.getAllTravelsByDriverId(Number(driverId));
    return this.travelMapper.toResponseList(travels);
  }

  @Get('organizer/:organizerId')
  @ApiOperation({ summary: 'Viajes por organizador' })
  @ApiParam({ name: 'organizerId', description: 'ID del organizador' })
  @ApiResponse({ status: 200, type: [TravelResponseDto] })
  async getAllTravelsByOrganizerId(@Param('organizerId') organizerId: string): Promise<TravelResponseDto[]> {
    const travels = await this.travelService.getAllTravelsByOrganizerId(Number(organizerId));
    return this.travelMapper.toResponseList(travels);
  }

  @Get('passenger/:passengerId')
  @ApiOperation({ summary: 'Viajes por pasajero' })
  @ApiParam({ name: 'passengerId', description: 'ID del pasajero' })
  @ApiResponse({ status: 200, type: [TravelResponseDto] })
  async getAllTravelsByPassengerId(@Param('passengerId') passengerId: string): Promise<TravelResponseDto[]> {
    const travels = await this.travelService.getAllTravelsByPassengerId(Number(passengerId));
    return this.travelMapper.toResponseList(travels);
  }

  @Get('occupantList/:id')
  @ApiOperation({ summary: 'Validar lista de pasajeros de un viaje' })
  @ApiParam({ name: 'id', description: 'ID del viaje' })
  @ApiResponse({ status: 200, type: [Number] })
  async getPassengerList(
    @Param('id') id: string,
    @Body() passengersId: number[],
  ): Promise<number[]> {
    return this.travelService.getPassengerList(id, passengersId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un viaje por ID' })
  @ApiParam({ name: 'id', description: 'ID del viaje' })
  @ApiResponse({ status: 200, type: TravelResponseDto })
  @ApiResponse({ status: 404, description: 'Viaje no encontrado' })
  async getTravelById(@Param('id') id: string): Promise<TravelResponseDto> {
    const travel = await this.travelService.getTravelById(id);
    return this.travelMapper.toResponse(travel);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un viaje' })
  @ApiParam({ name: 'id', description: 'ID del viaje' })
  @ApiResponse({ status: 204 })
  async deleteTravelById(@Param('id') id: string): Promise<void> {
    return this.travelService.deleteTravelById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cambiar estado de un viaje' })
  @ApiParam({ name: 'id', description: 'ID del viaje' })
  @ApiBody({ schema: { enum: Object.values(Status) } })
  @ApiResponse({ status: 200, type: TravelResponseDto })
  async changeStateTravel(
    @Param('id') id: string,
    @Body() status: Status,
  ): Promise<TravelResponseDto> {
    const travel = await this.travelService.changeStateTravel(id, status);
    return this.travelMapper.toResponse(travel);
  }

  @Patch(':id/slots')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar cupos disponibles' })
  @ApiParam({ name: 'id', description: 'ID del viaje' })
  @ApiBody({ schema: { properties: { quantity: { type: 'number', example: -1 } } } })
  @ApiResponse({ status: 200 })
  async updateAvailableSlots(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<void> {
    return this.travelService.updateAvailableSlots(id, quantity);
  }

  @Patch(':id/passengers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar lista de pasajeros' })
  @ApiParam({ name: 'id', description: 'ID del viaje' })
  @ApiBody({ schema: { properties: { passengersIds: { type: 'array', items: { type: 'number' }, example: [1, 2, 3] } } } })
  @ApiResponse({ status: 200 })
  async updatePassengers(
    @Param('id') id: string,
    @Body('passengersIds') passengersIds: number[],
  ): Promise<void> {
    return this.travelService.updatePassengers(id, passengersIds);
  }
}
