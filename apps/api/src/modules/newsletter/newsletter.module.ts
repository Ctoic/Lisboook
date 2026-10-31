import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Injectable,
  Module,
  Post
} from "@nestjs/common";
import type { NewsletterSubscribeResponseContract } from "@lisbook/types";
import { IsEmail, IsOptional, IsString, MaxLength, isEmail } from "class-validator";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";

class SubscribeDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}

@Injectable()
class NewsletterService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async subscribe(dto: SubscribeDto): Promise<NewsletterSubscribeResponseContract> {
    // Checked here as well because the tsx dev runner skips decorator metadata, so ValidationPipe can't see the DTO.
    const email = typeof dto?.email === "string" ? dto.email.trim().toLowerCase() : "";
    if (!isEmail(email) || email.length > 254) {
      throw new BadRequestException("Please provide a valid email address");
    }

    // Re-subscribing is idempotent so the public form never leaks whether an email exists.
    const subscriber = await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email, source: typeof dto.source === "string" ? dto.source.slice(0, 64) : "web" }
    });

    return {
      email: subscriber.email,
      subscribedAt: subscriber.subscribedAt.toISOString()
    };
  }
}

@Controller("newsletter")
class NewsletterController {
  constructor(@Inject(NewsletterService) private readonly newsletterService: NewsletterService) {}

  @Post()
  @HttpCode(201)
  async subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [NewsletterController],
  providers: [NewsletterService]
})
export class NewsletterModule {}
