import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class LocationDto {
  @ApiProperty({ example: 6.2442 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -75.5812 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'Calle 50 # 40-20, Medellín' })
  @IsString()
  direction: string;
}
