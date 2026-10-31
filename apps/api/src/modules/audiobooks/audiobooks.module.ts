import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import type {
  AudiobookDetailContract,
  AudiobookListItemContract,
  ChapterContract,
  PaginatedResponse
} from "@lisbook/types";
import { EntityStatus, Visibility } from "@prisma/client";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";
import { slugify } from "../../common/slugify";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AdminRoute } from "../../common/auth/admin-route.decorator";
import { CreateAudiobookDto } from "./dto/create-audiobook.dto";
import { UpdateAudiobookDto } from "./dto/update-audiobook.dto";

@Injectable()
class AudiobooksService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto): Promise<PaginatedResponse<AudiobookListItemContract>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.audiobook.findMany({
        include: {
          authors: { include: { author: true } },
          narrators: { include: { narrator: true } },
          category: true,
          coverAsset: true
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.audiobook.count()
    ]);

    return {
      data: items.map((item) => this.toListContract(item)),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
      }
    };
  }

  async getBySlug(slug: string): Promise<AudiobookDetailContract> {
    const item = await this.prisma.audiobook.findUnique({
      where: { slug },
      include: {
        authors: { include: { author: true } },
        narrators: { include: { narrator: true } },
        category: true,
        coverAsset: true,
        chapters: {
          orderBy: [{ sortOrder: "asc" }, { chapterNumber: "asc" }],
          include: { audioAsset: true }
        }
      }
    });

    if (!item) {
      throw new NotFoundException(`Audiobook '${slug}' was not found`);
    }

    return this.toDetailContract(item);
  }

  async create(dto: CreateAudiobookDto): Promise<AudiobookDetailContract> {
    const author = await this.prisma.author.upsert({
      where: { slug: slugify(dto.authorName) },
      update: {
        name: dto.authorName
      },
      create: {
        name: dto.authorName,
        slug: slugify(dto.authorName),
        status: EntityStatus.published
      }
    });

    const narrator = dto.narratorName
      ? await this.prisma.narrator.upsert({
          where: { slug: slugify(dto.narratorName) },
          update: {
            name: dto.narratorName
          },
          create: {
            name: dto.narratorName,
            slug: slugify(dto.narratorName),
            status: EntityStatus.published
          }
        })
      : null;

    const category = dto.categoryName
      ? await this.prisma.category.upsert({
          where: { slug: slugify(dto.categoryName) },
          update: {
            name: dto.categoryName
          },
          create: {
            name: dto.categoryName,
            slug: slugify(dto.categoryName),
            status: EntityStatus.published
          }
        })
      : null;

    const created = await this.prisma.audiobook.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        language: dto.language ?? "en",
        status: dto.status ?? "draft",
        visibility: dto.visibility ?? "public",
        isFeatured: dto.isFeatured ?? false,
        categoryId: category?.id,
        authors: {
          create: [{ authorId: author.id }]
        },
        narrators: narrator
          ? {
              create: [{ narratorId: narrator.id }]
            }
          : undefined
      },
      include: {
        authors: { include: { author: true } },
        narrators: { include: { narrator: true } },
        category: true,
        coverAsset: true,
        chapters: true
      }
    });

    return this.toDetailContract(created);
  }

  async update(id: string, dto: UpdateAudiobookDto): Promise<AudiobookDetailContract> {
    const current = await this.prisma.audiobook.findUnique({
      where: { id },
      include: {
        authors: true,
        narrators: true
      }
    });

    if (!current) {
      throw new NotFoundException(`Audiobook '${id}' was not found`);
    }

    let categoryId = current.categoryId ?? undefined;
    if (dto.categoryName) {
      const category = await this.prisma.category.upsert({
        where: { slug: slugify(dto.categoryName) },
        update: { name: dto.categoryName },
        create: {
          name: dto.categoryName,
          slug: slugify(dto.categoryName),
          status: EntityStatus.published
        }
      });
      categoryId = category.id;
    }

    const updated = await this.prisma.audiobook.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        language: dto.language,
        status: dto.status as EntityStatus | undefined,
        visibility: dto.visibility as Visibility | undefined,
        isFeatured: dto.isFeatured,
        categoryId
      },
      include: {
        authors: { include: { author: true } },
        narrators: { include: { narrator: true } },
        category: true,
        coverAsset: true,
        chapters: {
          orderBy: [{ sortOrder: "asc" }, { chapterNumber: "asc" }]
        }
      }
    });

    if (dto.authorName) {
      const author = await this.prisma.author.upsert({
        where: { slug: slugify(dto.authorName) },
        update: { name: dto.authorName },
        create: {
          name: dto.authorName,
          slug: slugify(dto.authorName),
          status: EntityStatus.published
        }
      });

      await this.prisma.audiobookAuthor.deleteMany({ where: { audiobookId: id } });
      await this.prisma.audiobookAuthor.create({
        data: {
          audiobookId: id,
          authorId: author.id
        }
      });
    }

    if (dto.narratorName !== undefined) {
      await this.prisma.audiobookNarrator.deleteMany({ where: { audiobookId: id } });
      if (dto.narratorName) {
        const narrator = await this.prisma.narrator.upsert({
          where: { slug: slugify(dto.narratorName) },
          update: { name: dto.narratorName },
          create: {
            name: dto.narratorName,
            slug: slugify(dto.narratorName),
            status: EntityStatus.published
          }
        });
        await this.prisma.audiobookNarrator.create({
          data: {
            audiobookId: id,
            narratorId: narrator.id
          }
        });
      }
    }

    return this.getBySlug(updated.slug);
  }

  private toListContract(item: any): AudiobookListItemContract {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      authorName: item.authors[0]?.author.name ?? "Unknown Author",
      narratorName: item.narrators[0]?.narrator.name ?? null,
      categoryName: item.category?.name ?? null,
      status: item.status,
      visibility: item.visibility,
      coverUrl: item.coverAsset?.sourceUrl ?? null,
      totalDurationSeconds: item.totalDurationSeconds,
      isFeatured: item.isFeatured
    };
  }

  private toChapterContract(chapter: any): ChapterContract {
    return {
      id: chapter.id,
      audiobookId: chapter.audiobookId,
      title: chapter.title,
      chapterNumber: chapter.chapterNumber,
      durationSeconds: chapter.durationSeconds,
      audioAssetId: chapter.audioAssetId,
      audioUrl: chapter.audioAsset?.sourceUrl ?? null,
      isPreview: chapter.isPreview
    };
  }

  private toDetailContract(item: any): AudiobookDetailContract {
    return {
      ...this.toListContract(item),
      description: item.description,
      language: item.language,
      chapters: item.chapters.map((chapter: any) => this.toChapterContract(chapter))
    };
  }
}

@Controller("audiobooks")
class PublicAudiobooksController {
  constructor(@Inject(AudiobooksService) private readonly audiobooksService: AudiobooksService) {}

  @Get()
  async list(@Query() query: PaginationQueryDto) {
    return this.audiobooksService.list(query);
  }

  @Get(":slug")
  async getOne(@Param("slug") slug: string) {
    return this.audiobooksService.getBySlug(slug);
  }

  @Get(":slug/chapters")
  async getChapters(@Param("slug") slug: string) {
    return (await this.audiobooksService.getBySlug(slug)).chapters;
  }
}

@Controller("admin/audiobooks")
@AdminRoute("super_admin", "editor")
class AdminAudiobooksController {
  constructor(@Inject(AudiobooksService) private readonly audiobooksService: AudiobooksService) {}

  @Get()
  async list(@Query() query: PaginationQueryDto) {
    return this.audiobooksService.list(query);
  }

  @Post()
  async create(@Body() dto: CreateAudiobookDto) {
    return this.audiobooksService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAudiobookDto) {
    return this.audiobooksService.update(id, dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [PublicAudiobooksController, AdminAudiobooksController],
  providers: [AudiobooksService],
  exports: [AudiobooksService]
})
export class AudiobooksModule {}
