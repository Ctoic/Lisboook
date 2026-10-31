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
import type { FaqContract } from "@lisbook/types";
import { AdminRoute } from "../../common/auth/admin-route.decorator";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UpdateFaqDto } from "./dto/update-faq.dto";

@Injectable()
class FaqsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(): Promise<FaqContract[]> {
    const faqs = await this.prisma.faq.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
      locale: faq.locale,
      sortOrder: faq.sortOrder
    }));
  }

  async update(id: string, dto: UpdateFaqDto): Promise<FaqContract> {
    const existing = await this.prisma.faq.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException(`FAQ '${id}' was not found`);
    }

    const faq = await this.prisma.faq.update({
      where: { id },
      data: {
        question: dto.question,
        answer: dto.answer,
        sortOrder: dto.sortOrder,
        status: dto.status
      }
    });

    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
      locale: faq.locale,
      sortOrder: faq.sortOrder
    };
  }
}

@Controller("faqs")
class PublicFaqsController {
  constructor(@Inject(FaqsService) private readonly faqsService: FaqsService) {}

  @Get()
  async list() {
    return this.faqsService.list();
  }
}

@Controller("admin/faqs")
@AdminRoute("super_admin", "editor")
class AdminFaqsController {
  constructor(@Inject(FaqsService) private readonly faqsService: FaqsService) {}

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateFaqDto) {
    return this.faqsService.update(id, dto);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [PublicFaqsController, AdminFaqsController],
  providers: [FaqsService]
})
export class FaqsModule {}
