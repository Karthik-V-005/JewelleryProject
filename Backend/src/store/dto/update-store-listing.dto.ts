import { IsString, IsOptional } from 'class-validator';

export class UpdateStoreListingDto {
  @IsString()
  @IsOptional()
  storeName?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsOptional()
  categories?: string[] | string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  pincode?: string;

  @IsString()
  @IsOptional()
  googleMapsLink?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsOptional()
  emails?: string[] | string;

  @IsString()
  @IsOptional()
  phone?: string;

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
  status?: string;

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

  @IsOptional()
  removeLogo?: boolean | string;

  @IsOptional()
  removeCover?: boolean | string;
}
