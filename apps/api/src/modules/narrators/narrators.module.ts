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
import { slugify } from "../../common/slugify";
import { IsOptional, IsString, MinLength } from "class-validator";

class CreateNarratorDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

class UpdateNarratorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

@Injectable()
class NarratorsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.narrator.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async create(dto: CreateNarratorDto) {
    return this.prisma.narrator.create({
      data: {
        name: dto.name,
        slug: slugify(dto.name),
        bio: dto.bio,
        status: "published"
      }
    });
  }

  async update(id: string, dto: UpdateNarratorDto) {
    return this.prisma.narrator.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.name ? slugify(dto.name) : undefined,
        bio: dto.bio
      }
    });
  }
}

@Controller("admin/narrators")
@AdminRoute("super_admin", "editor")
class NarratorsController {
  constructor(@Inject(NarratorsService) private readonly narratorsService: NarratorsService) {}

  @Get()
  async list() {
    return this.narratorsService.list();
  }

  @Post()
  async create(@Body() dto: CreateNarratorDto) {
    return this.narratorsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateNarratorDto) {
    return this.narratorsService.update(id, dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [NarratorsController],
  providers: [NarratorsService]
})
export class NarratorsModule {}
