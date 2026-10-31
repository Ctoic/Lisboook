import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Inject,
  Injectable,
  Logger,
  Module,
  Post,
  UnauthorizedException
} from "@nestjs/common";
import { Prisma, type Role, type User, type UserRole } from "@prisma/client";
import type { LoginResponseContract } from "@lisbook/types";
import { hashPassword, isPasswordHash, verifyPassword } from "../../common/auth/password";
import { issueToken } from "../../common/auth/tokens";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accounts seeded before real passwords existed sign in with this, once, outside production.
const LEGACY_DEV_PASSWORD = "password123";
const INVALID_LOGIN = "Invalid email or password";

type UserWithRoles = User & { roles: Array<UserRole & { role: Role }> };

// Validated by hand: the tsx dev runner drops decorator metadata, so ValidationPipe can't see a DTO here.
function readCredentials(body: Record<string, unknown>) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!EMAIL_RE.test(email) || email.length > 254) throw new BadRequestException("Enter a valid email address.");
  return { email, password };
}

@Injectable()
class AuthService {
  private readonly logger = new Logger("Auth");

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async login(body: Record<string, unknown>): Promise<LoginResponseContract> {
    const { email, password } = readCredentials(body);
    if (!password) throw new UnauthorizedException(INVALID_LOGIN);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } }
    });
    if (!user || user.status === "suspended") throw new UnauthorizedException(INVALID_LOGIN);

    if (isPasswordHash(user.passwordHash)) {
      if (!(await verifyPassword(password, user.passwordHash))) throw new UnauthorizedException(INVALID_LOGIN);
    } else if (process.env.NODE_ENV !== "production" && password === LEGACY_DEV_PASSWORD) {
      // Upgrade the seeded placeholder to a real hash so this path is only ever used once per account.
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
      this.logger.warn(`Upgraded legacy dev password for ${email}`);
    } else {
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    return this.session(user);
  }

  async register(body: Record<string, unknown>): Promise<LoginResponseContract> {
    const { email, password } = readCredentials(body);
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().replace(/\s+/g, " ") : "";
    if (displayName.length < 2 || displayName.length > 60) throw new BadRequestException("Your name must be 2 to 60 characters.");
    if (password.length < 8) throw new BadRequestException("Password must be at least 8 characters.");
    if (password.length > 128) throw new BadRequestException("Password must be at most 128 characters.");

    const listener = await this.prisma.role.upsert({
      where: { name: "listener" },
      update: {},
      create: { name: "listener", description: "Can listen, save favorites and write in the Inkverse" }
    });

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          displayName,
          passwordHash: await hashPassword(password),
          roles: { create: { roleId: listener.id } }
        },
        include: { roles: { include: { role: true } } }
      });
      return this.session(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("An account with this email already exists. Try signing in.");
      }
      throw error;
    }
  }

  private session(user: UserWithRoles): LoginResponseContract {
    return {
      accessToken: issueToken(user.id, "access"),
      refreshToken: issueToken(user.id, "refresh"),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles.map((entry) => entry.role.name)
      }
    };
  }
}

@Controller("auth")
class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: Record<string, unknown>) {
    return this.authService.login(body ?? {});
  }

  @Post("register")
  async register(@Body() body: Record<string, unknown>) {
    return this.authService.register(body ?? {});
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
