import { Body, Controller, Inject, Injectable, Module, Post } from "@nestjs/common";
import type { ChapterContract } from "@lisbook/types";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AdminRoute } from "../../common/auth/admin-route.decorator";
import { CreateChapterDto } from "./dto/create-chapter.dto";

@Injectable()
class ChaptersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: CreateChapterDto): Promise<ChapterContract> {
    const created = await this.prisma.chapter.create({
      data: {
        audiobookId: dto.audiobookId,
        title: dto.title,
        chapterNumber: dto.chapterNumber,
        durationSeconds: dto.durationSeconds,
        audioAssetId: dto.audioAssetId,
        isPreview: dto.isPreview ?? false,
        sortOrder: dto.chapterNumber
      }
    });

    return {
      id: created.id,
      audiobookId: created.audiobookId,
      title: created.title,
      chapterNumber: created.chapterNumber,
      durationSeconds: created.durationSeconds,
      audioAssetId: created.audioAssetId,
      isPreview: created.isPreview
    };
  }
}

@Controller("admin/chapters")
@AdminRoute("super_admin", "editor")
class ChaptersController {
  constructor(@Inject(ChaptersService) private readonly chaptersService: ChaptersService) {}

  @Post()
  async create(@Body() dto: CreateChapterDto) {
    return this.chaptersService.create(dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [ChaptersController],
  providers: [ChaptersService]
})
export class ChaptersModule {}
