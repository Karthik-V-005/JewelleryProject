import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateStoreListingDto } from './dto/create-store-listing.dto';
import { UpdateStoreListingDto } from './dto/update-store-listing.dto';
import { CreateStoreOfferDto } from './dto/create-store-offer.dto';

@Injectable()
export class StoreService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  private async generateUniqueSlug(base: string, currentId?: number): Promise<string> {
    let slug = this.slugify(base);
    let count = 0;
    while (true) {
      const candidate = count === 0 ? slug : `${slug}-${count}`;
      const existing = await this.prisma.storeListing.findUnique({
        where: { slug: candidate },
      });
      if (!existing || (currentId && existing.id === currentId)) {
        return candidate;
      }
      count++;
    }
  }

  private parseCategories(input: any): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((i) => String(i).trim());
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed.map((i) => String(i).trim());
      } catch {
        return input.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  private parseSocialLinks(input: any): any {
    if (!input) return null;
    if (typeof input === 'object') return input;
    if (typeof input === 'string') {
      try {
        return JSON.parse(input);
      } catch {
        return null;
      }
    }
    return null;
  }

  private parseStringArray(input: any): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((i) => String(i).trim()).filter(Boolean);
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed.map((i) => String(i).trim()).filter(Boolean);
      } catch {
        return input.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  private parseJsonObject(input: any): any {
    if (!input) return null;
    if (typeof input === 'object') return input;
    if (typeof input === 'string') {
      try {
        return JSON.parse(input);
      } catch {
        return null;
      }
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────
     ADMIN METHODS
  ───────────────────────────────────────────────────────────── */

  async createStoreListing(
    dto: CreateStoreListingDto,
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    const slugBase = dto.slug || `${dto.storeName}-${dto.city}`;
    const slug = await this.generateUniqueSlug(slugBase);

    let logoUrl = dto.logoUrl || null;
    if (files?.logo && files.logo[0]) {
      const upload: any = await this.cloudinary.uploadImage(
        files.logo[0],
        'stores/logos',
      );
      logoUrl = upload.secure_url;
    }

    let coverPhotoUrl = dto.coverPhotoUrl || null;
    if (files?.coverPhoto && files.coverPhoto[0]) {
      const upload: any = await this.cloudinary.uploadImage(
        files.coverPhoto[0],
        'stores/covers',
      );
      coverPhotoUrl = upload.secure_url;
    }

    const categories = this.parseCategories(dto.categories);
    const socialLinks = this.parseSocialLinks(dto.socialLinks);
    const isVerified =
      dto.isVerified === true || dto.isVerified === 'true';
    const status = (dto.status || 'DRAFT').toUpperCase();

    const country = dto.country?.trim() || 'India';
    const emails = this.parseStringArray(dto.emails);
    const email = dto.email?.trim() || (emails.length > 0 ? emails[0] : null);
    if (email && !emails.includes(email)) {
      emails.unshift(email);
    }

    const phones = this.parseStringArray(dto.phones);
    const phone = dto.phone?.trim() || (phones.length > 0 ? phones[0] : '');
    if (phone && !phones.includes(phone)) {
      phones.unshift(phone);
    }

    const daywiseHours = this.parseJsonObject(dto.daywiseHours);
    const weeklyHolidays = this.parseStringArray(dto.weeklyHolidays);
    const weeklyHoliday =
      dto.weeklyHoliday ||
      (weeklyHolidays.length > 0 ? weeklyHolidays.join(', ') : 'None');

    const store = await this.prisma.storeListing.create({
      data: {
        slug,
        store_name: dto.storeName,
        logo_url: logoUrl,
        cover_photo_url: coverPhotoUrl,
        short_description: dto.shortDescription || null,
        categories,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country,
        pincode: dto.pincode,
        google_maps_link: dto.googleMapsLink || null,
        email,
        emails,
        phone,
        phones,
        whatsapp: dto.whatsapp || null,
        website: dto.website || null,
        social_links: socialLinks,
        opening_hours: dto.openingHours || null,
        daywise_hours: daywiseHours,
        weekly_holiday: weeklyHoliday,
        weekly_holidays: weeklyHolidays,
        status,
        is_verified: isVerified,
        info_source: dto.infoSource || null,
        store_contact: dto.storeContact || null,
        photo_permissions: dto.photoPermissions || null,
        internal_notes: dto.internalNotes || null,
        published_at: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    // Handle initial gallery files if provided
    if (files?.gallery && files.gallery.length > 0) {
      for (let i = 0; i < files.gallery.length; i++) {
        const file = files.gallery[i];
        const upload: any = await this.cloudinary.uploadImage(
          file,
          'stores/gallery',
        );
        await this.prisma.storeGallery.create({
          data: {
            store_id: store.id,
            image_url: upload.secure_url,
            display_order: i,
          },
        });
      }
    }

    return this.getAdminStoreById(store.id);
  }

  async getAllAdminStores(query?: {
    status?: string;
    search?: string;
    isVerified?: string;
  }) {
    const where: any = {};
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status.toUpperCase();
    }
    if (query?.isVerified !== undefined && query.isVerified !== 'ALL') {
      where.is_verified = query.isVerified === 'true';
    }
    if (query?.search) {
      const q = query.search;
      where.OR = [
        { store_name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.storeListing.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            gallery: true,
            offers: true,
            claim_requests: true,
            report_requests: true,
          },
        },
      },
    });
  }

  async getAdminStoreById(id: number) {
    const store = await this.prisma.storeListing.findUnique({
      where: { id },
      include: {
        gallery: {
          orderBy: { display_order: 'asc' },
        },
        offers: {
          orderBy: { created_at: 'desc' },
        },
        claim_requests: {
          orderBy: { created_at: 'desc' },
        },
        report_requests: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async updateStoreListing(
    id: number,
    dto: UpdateStoreListingDto,
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    const current = await this.getAdminStoreById(id);

    let logoUrl = current.logo_url;
    if (dto.removeLogo === true || dto.removeLogo === 'true') {
      logoUrl = null;
    }
    if (dto.logoUrl !== undefined) {
      logoUrl = dto.logoUrl;
    }
    if (files?.logo && files.logo[0]) {
      const upload: any = await this.cloudinary.uploadImage(
        files.logo[0],
        'stores/logos',
      );
      logoUrl = upload.secure_url;
    }

    let coverPhotoUrl = current.cover_photo_url;
    if (dto.removeCover === true || dto.removeCover === 'true') {
      coverPhotoUrl = null;
    }
    if (dto.coverPhotoUrl !== undefined) {
      coverPhotoUrl = dto.coverPhotoUrl;
    }
    if (files?.coverPhoto && files.coverPhoto[0]) {
      const upload: any = await this.cloudinary.uploadImage(
        files.coverPhoto[0],
        'stores/covers',
      );
      coverPhotoUrl = upload.secure_url;
    }

    let slug = current.slug;
    if (dto.slug && dto.slug !== current.slug) {
      slug = await this.generateUniqueSlug(dto.slug, current.id);
    } else if (dto.storeName && dto.storeName !== current.store_name && !dto.slug) {
      const city = dto.city || current.city;
      slug = await this.generateUniqueSlug(`${dto.storeName}-${city}`, current.id);
    }

    const categories =
      dto.categories !== undefined
        ? this.parseCategories(dto.categories)
        : current.categories;

    const socialLinks =
      dto.socialLinks !== undefined
        ? this.parseSocialLinks(dto.socialLinks)
        : current.social_links;

    let emails = current.emails || [];
    let email = current.email;
    if (dto.emails !== undefined) {
      emails = this.parseStringArray(dto.emails);
    }
    if (dto.email !== undefined) {
      email = dto.email ? dto.email.trim() : null;
      if (email && !emails.includes(email)) {
        emails = [email, ...emails];
      }
    } else if (emails.length > 0 && !email) {
      email = emails[0];
    }

    let phones = current.phones || [];
    let phone = current.phone;
    if (dto.phones !== undefined) {
      phones = this.parseStringArray(dto.phones);
    }
    if (dto.phone !== undefined) {
      phone = dto.phone.trim();
      if (phone && !phones.includes(phone)) {
        phones = [phone, ...phones];
      }
    } else if (phones.length > 0 && !phone) {
      phone = phones[0];
    }

    let weeklyHolidays = current.weekly_holidays || [];
    let weeklyHoliday = current.weekly_holiday;
    if (dto.weeklyHolidays !== undefined) {
      weeklyHolidays = this.parseStringArray(dto.weeklyHolidays);
      weeklyHoliday = weeklyHolidays.length > 0 ? weeklyHolidays.join(', ') : 'None';
    } else if (dto.weeklyHoliday !== undefined) {
      weeklyHoliday = dto.weeklyHoliday || 'None';
    }

    const daywiseHours =
      dto.daywiseHours !== undefined
        ? this.parseJsonObject(dto.daywiseHours)
        : current.daywise_hours;

    const country =
      dto.country !== undefined ? dto.country.trim() || 'India' : current.country || 'India';

    const isVerified =
      dto.isVerified !== undefined
        ? dto.isVerified === true || dto.isVerified === 'true'
        : current.is_verified;

    const status = dto.status
      ? dto.status.toUpperCase()
      : current.status;

    let publishedAt = current.published_at;
    if (status === 'PUBLISHED' && !publishedAt) {
      publishedAt = new Date();
    }

    await this.prisma.storeListing.update({
      where: { id },
      data: {
        slug,
        ...(dto.storeName && { store_name: dto.storeName }),
        logo_url: logoUrl,
        cover_photo_url: coverPhotoUrl,
        ...(dto.shortDescription !== undefined && {
          short_description: dto.shortDescription || null,
        }),
        categories,
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.state && { state: dto.state }),
        country,
        ...(dto.pincode && { pincode: dto.pincode }),
        ...(dto.googleMapsLink !== undefined && {
          google_maps_link: dto.googleMapsLink || null,
        }),
        email,
        emails,
        phone,
        phones,
        ...(dto.whatsapp !== undefined && {
          whatsapp: dto.whatsapp || null,
        }),
        ...(dto.website !== undefined && {
          website: dto.website || null,
        }),
        social_links: socialLinks,
        ...(dto.openingHours !== undefined && {
          opening_hours: dto.openingHours || null,
        }),
        daywise_hours: daywiseHours,
        weekly_holiday: weeklyHoliday,
        weekly_holidays: weeklyHolidays,
        status,
        is_verified: isVerified,
        ...(dto.infoSource !== undefined && {
          info_source: dto.infoSource || null,
        }),
        ...(dto.storeContact !== undefined && {
          store_contact: dto.storeContact || null,
        }),
        ...(dto.photoPermissions !== undefined && {
          photo_permissions: dto.photoPermissions || null,
        }),
        ...(dto.internalNotes !== undefined && {
          internal_notes: dto.internalNotes || null,
        }),
        published_at: publishedAt,
      },
    });

    if (files?.gallery && files.gallery.length > 0) {
      const highestOrder = current.gallery.length;
      for (let i = 0; i < files.gallery.length; i++) {
        const file = files.gallery[i];
        const upload: any = await this.cloudinary.uploadImage(
          file,
          'stores/gallery',
        );
        await this.prisma.storeGallery.create({
          data: {
            store_id: id,
            image_url: upload.secure_url,
            display_order: highestOrder + i,
          },
        });
      }
    }

    return this.getAdminStoreById(id);
  }

  async deleteStoreListing(id: number) {
    await this.getAdminStoreById(id);
    await this.prisma.storeListing.delete({ where: { id } });
    return { success: true, message: 'Store listing deleted successfully' };
  }

  async togglePublishStatus(id: number, status: string) {
    const valid = ['PUBLISHED', 'UNPUBLISHED', 'DRAFT'];
    const s = status.toUpperCase();
    if (!valid.includes(s)) {
      throw new BadRequestException('Invalid status');
    }

    return this.prisma.storeListing.update({
      where: { id },
      data: {
        status: s,
        ...(s === 'PUBLISHED' && { published_at: new Date() }),
      },
    });
  }

  async toggleVerification(id: number, isVerified?: boolean) {
    const current = await this.getAdminStoreById(id);
    const nextVal =
      isVerified !== undefined ? isVerified : !current.is_verified;

    return this.prisma.storeListing.update({
      where: { id },
      data: { is_verified: nextVal },
    });
  }

  /* ─────────────────────────────────────────────────────────────
     GALLERY MANAGEMENT
  ───────────────────────────────────────────────────────────── */

  async addGalleryImages(storeId: number, files: Express.Multer.File[]) {
    await this.getAdminStoreById(storeId);
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    const created: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const upload: any = await this.cloudinary.uploadImage(
        files[i],
        'stores/gallery',
      );
      const item = await this.prisma.storeGallery.create({
        data: {
          store_id: storeId,
          image_url: upload.secure_url,
          display_order: i,
        },
      });
      created.push(item);
    }
    return created;
  }

  async deleteGalleryImage(storeId: number, imageId: number) {
    const image = await this.prisma.storeGallery.findFirst({
      where: { id: imageId, store_id: storeId },
    });
    if (!image) {
      throw new NotFoundException('Gallery image not found');
    }
    await this.prisma.storeGallery.delete({ where: { id: imageId } });
    return { success: true, message: 'Image deleted from gallery' };
  }

  /* ─────────────────────────────────────────────────────────────
     STORE OFFERS MANAGEMENT (Auto-expiry supported)
  ───────────────────────────────────────────────────────────── */

  async addStoreOffer(
    storeId: number,
    dto: CreateStoreOfferDto,
    file?: Express.Multer.File,
  ) {
    await this.getAdminStoreById(storeId);

    let posterUrl = null;
    if (file) {
      const upload: any = await this.cloudinary.uploadImage(
        file,
        'stores/offers',
      );
      posterUrl = upload.secure_url;
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    const isActive =
      dto.isActive === undefined
        ? true
        : dto.isActive === true || dto.isActive === 'true';

    return this.prisma.storeOffer.create({
      data: {
        store_id: storeId,
        title: dto.title,
        description: dto.description || null,
        poster_url: posterUrl,
        start_date: startDate,
        end_date: endDate,
        terms: dto.terms || null,
        is_active: isActive,
      },
    });
  }

  async deleteStoreOffer(offerId: number) {
    const offer = await this.prisma.storeOffer.findUnique({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('Store offer not found');
    await this.prisma.storeOffer.delete({ where: { id: offerId } });
    return { success: true, message: 'Offer deleted' };
  }

  /* ─────────────────────────────────────────────────────────────
     PUBLIC CUSTOMER-FACING METHODS
  ───────────────────────────────────────────────────────────── */

  async getPublicStores(query?: {
    search?: string;
    country?: string;
    city?: string;
    state?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 12;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (query?.country && query.country !== 'ALL') {
      where.country = { equals: query.country, mode: 'insensitive' };
    }
    if (query?.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }
    if (query?.state) {
      where.state = { equals: query.state, mode: 'insensitive' };
    }
    if (query?.category) {
      where.categories = { has: query.category };
    }
    if (query?.search) {
      const q = query.search;
      where.OR = [
        { store_name: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { short_description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, stores] = await Promise.all([
      this.prisma.storeListing.count({ where }),
      this.prisma.storeListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ is_verified: 'desc' }, { updated_at: 'desc' }],
        select: {
          id: true,
          slug: true,
          store_name: true,
          logo_url: true,
          cover_photo_url: true,
          short_description: true,
          categories: true,
          address: true,
          country: true,
          city: true,
          state: true,
          pincode: true,
          google_maps_link: true,
          phone: true,
          phones: true,
          email: true,
          emails: true,
          whatsapp: true,
          website: true,
          social_links: true,
          opening_hours: true,
          weekly_holiday: true,
          weekly_holidays: true,
          daywise_hours: true,
          is_verified: true,
          status: true,
          updated_at: true,
          _count: {
            select: {
              gallery: true,
              offers: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: stores,
    };
  }

  async getPublicStoreProfile(slugOrId: string) {
    const isId = !isNaN(Number(slugOrId));
    const now = new Date();
    // Start of today for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const store = await this.prisma.storeListing.findFirst({
      where: isId ? { id: Number(slugOrId) } : { slug: slugOrId },
      include: {
        gallery: {
          orderBy: { display_order: 'asc' },
        },
        offers: {
          where: {
            is_active: true,
            OR: [
              { end_date: { gte: today } },
              { end_date: null },
            ],
          },
          orderBy: { end_date: 'asc' },
        },
      },
    });

    if (!store || store.status !== 'PUBLISHED') {
      throw new NotFoundException('Store listing not found or inactive');
    }

    // Exclude internal audit fields for public privacy
    const {
      info_source,
      store_contact,
      photo_permissions,
      internal_notes,
      ...publicData
    } = store;

    return {
      ...publicData,
      disclaimer:
        'JewellersParadise is a jewellery offers discovery platform. Purchases and enquiries are handled directly by the jeweller. Please confirm offer availability and terms with the store.',
    };
  }

  /* ─────────────────────────────────────────────────────────────
     CLAIMS & REPORTS
  ───────────────────────────────────────────────────────────── */

  async createClaimRequest(
    storeId: number,
    data: {
      claimantName: string;
      claimantPhone: string;
      claimantEmail: string;
      proofType?: string;
      notes?: string;
    },
    file?: Express.Multer.File,
  ) {
    await this.getAdminStoreById(storeId);
    let proofDocUrl =
      (data as any).proofDocUrl ||
      (data as any).documentLink ||
      (data as any).documentLinkOrGstin ||
      (data as any).gstin ||
      null;
    if (file) {
      const upload: any = await this.cloudinary.uploadImage(
        file,
        'stores/claim_proofs',
      );
      proofDocUrl = upload.secure_url;
    }

    return this.prisma.storeClaimRequest.create({
      data: {
        store_id: storeId,
        claimant_name: data.claimantName,
        claimant_phone: data.claimantPhone,
        claimant_email: data.claimantEmail,
        proof_type: data.proofType || null,
        proof_doc_url: proofDocUrl,
        notes: data.notes || null,
      },
    });
  }

  async createReportRequest(
    storeId: number,
    data: {
      reportType: string;
      description: string;
      reportedByEmail?: string;
    },
  ) {
    await this.getAdminStoreById(storeId);
    return this.prisma.storeReportRequest.create({
      data: {
        store_id: storeId,
        report_type: data.reportType,
        description: data.description,
        reported_by_email: data.reportedByEmail || null,
      },
    });
  }

  async getAllClaimRequests() {
    return this.prisma.storeClaimRequest.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        store: {
          select: {
            id: true,
            store_name: true,
            city: true,
            phone: true,
          },
        },
      },
    });
  }

  async getAllReportRequests() {
    return this.prisma.storeReportRequest.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        store: {
          select: {
            id: true,
            store_name: true,
            city: true,
          },
        },
      },
    });
  }

  async updateClaimRequestStatus(id: number, status: string, adminNotes?: string) {
    return this.prisma.storeClaimRequest.update({
      where: { id },
      data: {
        status,
        ...(adminNotes && { admin_notes: adminNotes }),
      },
    });
  }

  async updateReportRequestStatus(id: number, status: string, adminNotes?: string) {
    return this.prisma.storeReportRequest.update({
      where: { id },
      data: {
        status,
        ...(adminNotes && { admin_notes: adminNotes }),
      },
    });
  }
}
