import { Controller, Get, Inject, Injectable, Module } from "@nestjs/common";
import { AdminRoute } from "../../common/auth/admin-route.decorator";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
class RolesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  }
}

@Controller("admin/roles")
@AdminRoute("super_admin", "editor")
class RolesController {
  constructor(@Inject(RolesService) private readonly rolesService: RolesService) {}

  @Get()
  async list() {
    return this.rolesService.list();
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService]
})
export class RolesModule {}
