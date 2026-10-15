import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor, FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { StoreService } from './store.service';
import { CreateStoreListingDto } from './dto/create-store-listing.dto';
import { UpdateStoreListingDto } from './dto/update-store-listing.dto';
import { CreateStoreOfferDto } from './dto/create-store-offer.dto';

@Controller('admin/stores')
@UseGuards(JwtAuthGuard, new RolesGuard('ADMIN'))
export class AdminStoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  getAllStores(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('isVerified') isVerified?: string,
  ) {
    return this.storeService.getAllAdminStores({ status, search, isVerified });
  }

  @Get('claims')
  getClaims() {
    return this.storeService.getAllClaimRequests();
  }

  @Get('reports')
  getReports() {
    return this.storeService.getAllReportRequests();
  }

  @Get(':id')
  getStoreById(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.getAdminStoreById(id);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'coverPhoto', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
    ]),
  )
  createStore(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
    @Body() dto: CreateStoreListingDto,
  ) {
    return this.storeService.createStoreListing(dto, files);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'coverPhoto', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
    ]),
  )
  updateStore(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
    @Body() dto: UpdateStoreListingDto,
  ) {
    return this.storeService.updateStoreListing(id, dto, files);
  }

  @Delete(':id')
  deleteStore(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.deleteStoreListing(id);
  }

  @Patch(':id/publish')
  togglePublish(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.storeService.togglePublishStatus(id, status);
  }

  @Patch(':id/verify')
  toggleVerify(
    @Param('id', ParseIntPipe) id: number,
    @Body('isVerified') isVerified?: boolean,
  ) {
    return this.storeService.toggleVerification(id, isVerified);
  }

  @Post(':id/gallery')
  @UseInterceptors(FilesInterceptor('images', 10))
  addGallery(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.storeService.addGalleryImages(id, files);
  }

  @Delete(':id/gallery/:imageId')
  deleteGalleryImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.storeService.deleteGalleryImage(id, imageId);
  }

  @Post(':id/offers')
  @UseInterceptors(FileInterceptor('poster'))
  createOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStoreOfferDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.storeService.addStoreOffer(id, dto, file);
  }

  @Delete('offers/:offerId')
  deleteOffer(@Param('offerId', ParseIntPipe) offerId: number) {
    return this.storeService.deleteStoreOffer(offerId);
  }

  @Patch('claims/:claimId')
  updateClaimStatus(
    @Param('claimId', ParseIntPipe) claimId: number,
    @Body() body: { status: string; adminNotes?: string },
  ) {
    return this.storeService.updateClaimRequestStatus(
      claimId,
      body.status,
      body.adminNotes,
    );
  }

  @Patch('reports/:reportId')
  updateReportStatus(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() body: { status: string; adminNotes?: string },
  ) {
    return this.storeService.updateReportRequestStatus(
      reportId,
      body.status,
      body.adminNotes,
    );
  }
}
