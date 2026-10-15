import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoreService } from './store.service';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  getStores(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storeService.getPublicStores({
      search,
      city,
      state,
      category,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':slugOrId')
  getStoreProfile(@Param('slugOrId') slugOrId: string) {
    return this.storeService.getPublicStoreProfile(slugOrId);
  }

  @Post(':id/claim')
  @UseInterceptors(FileInterceptor('proofDocument'))
  submitClaim(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      claimantName: string;
      claimantPhone: string;
      claimantEmail: string;
      proofType?: string;
      proofDocUrl?: string;
      documentLink?: string;
      gstin?: string;
      documentLinkOrGstin?: string;
      notes?: string;
    },
  ) {
    return this.storeService.createClaimRequest(id, body, file);
  }

  @Post(':id/report')
  submitReport(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      reportType: string;
      description: string;
      reportedByEmail?: string;
    },
  ) {
    return this.storeService.createReportRequest(id, body);
  }
}
