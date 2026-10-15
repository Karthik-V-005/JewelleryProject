import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { AdminStoreController } from './admin-store.controller';
import { StoreService } from './store.service';
import { PrismaService } from 'prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  controllers: [StoreController, AdminStoreController],
  providers: [StoreService, PrismaService, CloudinaryService],
  exports: [StoreService],
})
export class StoreModule {}
