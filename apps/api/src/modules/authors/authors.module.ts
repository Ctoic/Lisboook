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

class CreateAuthorDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

class UpdateAuthorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

@Injectable()
class AuthorsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.author.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async create(dto: CreateAuthorDto) {
    return this.prisma.author.create({
      data: {
        name: dto.name,
        slug: slugify(dto.name),
        bio: dto.bio,
        status: "published"
      }
    });
  }

  async update(id: string, dto: UpdateAuthorDto) {
    return this.prisma.author.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.name ? slugify(dto.name) : undefined,
        bio: dto.bio
      }
    });
  }
}

@Controller("admin/authors")
@AdminRoute("super_admin", "editor")
class AuthorsController {
  constructor(@Inject(AuthorsService) private readonly authorsService: AuthorsService) {}

  @Get()
  async list() {
    return this.authorsService.list();
  }

  @Post()
  async create(@Body() dto: CreateAuthorDto) {
    return this.authorsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAuthorDto) {
    return this.authorsService.update(id, dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [AuthorsController],
  providers: [AuthorsService]
})
export class AuthorsModule {}
