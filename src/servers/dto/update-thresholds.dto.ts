
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateThresholdsDto {
  // CPU và RAM tính theo phần trăm
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cpuThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ramThreshold?: number;

  // Network tính theo byte/giây (B/s)
  @IsOptional()
  @IsInt()
  @Min(0)
  networkWarningThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  networkCriticalThreshold?: number;
}
