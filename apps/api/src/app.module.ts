import { Module } from "@nestjs/common";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { AudiobooksModule } from "./modules/audiobooks/audiobooks.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthorsModule } from "./modules/authors/authors.module";
import { CampfireModule } from "./modules/campfire/campfire.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ChaptersModule } from "./modules/chapters/chapters.module";
import { FaqsModule } from "./modules/faqs/faqs.module";
import { HealthModule } from "./modules/health/health.module";
import { InkverseModule } from "./modules/inkverse/inkverse.module";
import { NarratorsModule } from "./modules/narrators/narrators.module";
import { NewsletterModule } from "./modules/newsletter/newsletter.module";
import { PagesModule } from "./modules/pages/pages.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AssetsModule,
    AudiobooksModule,
    AuthorsModule,
    NarratorsModule,
    CategoriesModule,
    ChaptersModule,
    PagesModule,
    FaqsModule,
    NewsletterModule,
    AssistantModule,
    InkverseModule,
    CampfireModule
  ]
})
export class AppModule {}
