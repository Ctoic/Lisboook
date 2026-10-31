import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch
} from "@nestjs/common";
import type { PageContract } from "@lisbook/types";
import { AdminRoute } from "../../common/auth/admin-route.decorator";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UpdatePageDto } from "./dto/update-page.dto";

@Injectable()
class PagesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getBySlug(slug: string): Promise<PageContract> {
    const page = await this.prisma.page.findUnique({
      where: { slug }
    });

    if (!page) {
      throw new NotFoundException(`Page '${slug}' was not found`);
    }

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      locale: page.locale,
      content: page.contentJson
    };
  }

  async update(id: string, dto: UpdatePageDto): Promise<PageContract> {
    const existing = await this.prisma.page.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException(`Page '${id}' was not found`);
    }

    const page = await this.prisma.page.update({
      where: { id },
      data: {
        title: dto.title,
        contentJson: dto.content,
        status: dto.status
      }
    });

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      locale: page.locale,
      content: page.contentJson
    };
  }
}

@Controller("pages")
class PublicPagesController {
  constructor(@Inject(PagesService) private readonly pagesService: PagesService) {}

  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.pagesService.getBySlug(slug);
  }
}

@Controller("admin/pages")
@AdminRoute("super_admin", "editor")
class AdminPagesController {
  constructor(@Inject(PagesService) private readonly pagesService: PagesService) {}

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [PublicPagesController, AdminPagesController],
  providers: [PagesService]
})
export class PagesModule {}
