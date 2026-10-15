import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateStoreOfferDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsOptional()
  isActive?: boolean | string;
}
