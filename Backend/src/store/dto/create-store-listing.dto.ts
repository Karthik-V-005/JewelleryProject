import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateStoreListingDto {
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsOptional()
  categories?: string[] | string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsNotEmpty()
  pincode: string;

  @IsString()
  @IsOptional()
  googleMapsLink?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsOptional()
  emails?: string[] | string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  phones?: string[] | string;

  @IsString()
  @IsOptional()
  whatsapp?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsOptional()
  socialLinks?: Record<string, string> | string;

  @IsString()
  @IsOptional()
  openingHours?: string;

  @IsString()
  @IsOptional()
  weeklyHoliday?: string;

  @IsOptional()
  weeklyHolidays?: string[] | string;

  @IsOptional()
  daywiseHours?: Record<string, any> | string;

  @IsString()
  @IsOptional()
  status?: string; // 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'

  @IsOptional()
  isVerified?: boolean | string;

  // Private Admin Audit Fields
  @IsString()
  @IsOptional()
  infoSource?: string;

  @IsString()
  @IsOptional()
  storeContact?: string;

  @IsString()
  @IsOptional()
  photoPermissions?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  coverPhotoUrl?: string;
}
