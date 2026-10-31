import { Controller, Get, Inject, Injectable, Module } from "@nestjs/common";
import { AdminRoute } from "../../common/auth/admin-route.decorator";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list() {
    const users = await this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles.map((entry) => entry.role.name)
    }));
  }
}

@Controller("admin/users")
@AdminRoute("super_admin", "editor")
class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  async list() {
    return this.usersService.list();
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
