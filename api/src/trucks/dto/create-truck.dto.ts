import { TruckStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateTruckDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  vin!: string;

  @IsString()
  plate!: string;

  @IsInt()
  year!: number;

  @IsString()
  colorTag!: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsEnum(TruckStatus)
  @IsOptional()
  status?: TruckStatus;

  @IsString()
  depotId!: string;

  @IsString()
  @IsOptional()
  currentParkingSpotId?: string | null;
}


