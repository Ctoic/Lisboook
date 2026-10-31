import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Patch,
  Param,
  Post
} from "@nestjs/common";
import { AdminRoute } from "../../common/auth/admin-route.decorator";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";
import { LocalStorageService } from "../../common/storage/storage.service";
import { IsOptional, IsString, MinLength } from "class-validator";

class CreateImageAssetDto {
  @IsString()
  @MinLength(3)
  storageKey!: string;

  @IsString()
  @MinLength(3)
  mimeType!: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

class UpdateImageAssetDto {
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

@Injectable()
class AssetsService {
  constructor(
    @Inject(LocalStorageService) private readonly storage: LocalStorageService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  getProvider() {
    return {
      strategy: "local",
      sampleCover: this.storage.describe("covers/example.jpg"),
      sampleAudio: this.storage.describe("audio/example.mp3")
    };
  }

  async list() {
    const [images, audio] = await this.prisma.$transaction([
      this.prisma.imageAsset.findMany({ orderBy: { createdAt: "desc" } }),
      this.prisma.audioAsset.findMany({ orderBy: { createdAt: "desc" } })
    ]);

    return {
      images,
      audio
    };
  }

  async createImage(dto: CreateImageAssetDto) {
    return this.prisma.imageAsset.create({
      data: {
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        sourceUrl: dto.sourceUrl
      }
    });
  }

  async updateImage(id: string, dto: UpdateImageAssetDto) {
    return this.prisma.imageAsset.update({
      where: { id },
      data: {
        sourceUrl: dto.sourceUrl
      }
    });
  }
}

@Controller("admin/assets")
@AdminRoute("super_admin", "editor")
class AssetsController {
  constructor(@Inject(AssetsService) private readonly assetsService: AssetsService) {}

  @Get("provider")
  getProvider() {
    return this.assetsService.getProvider();
  }

  @Get()
  async list() {
    return this.assetsService.list();
  }

  @Post("images")
  async createImage(@Body() dto: CreateImageAssetDto) {
    return this.assetsService.createImage(dto);
  }

  @Patch("images/:id")
  async updateImage(@Param("id") id: string, @Body() dto: UpdateImageAssetDto) {
    return this.assetsService.updateImage(id, dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [AssetsController],
  providers: [AssetsService, LocalStorageService],
  exports: [AssetsService, LocalStorageService]
})
export class AssetsModule {}
