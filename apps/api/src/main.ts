import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { join, resolve } from "node:path";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("v1");
  // Legacy audio and cover art live in the repo root until object storage is wired up.
  // express.static handles Range requests, so the player can seek.
  const mediaRoot = process.env.MEDIA_ROOT ?? resolve(process.cwd(), "../..");
  app.useStaticAssets(join(mediaRoot, "audio"), { prefix: "/media/audio/", maxAge: "7d" });
  app.useStaticAssets(join(mediaRoot, "Images"), { prefix: "/media/images/", maxAge: "7d" });
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ],
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = process.env.PORT ? Number(process.env.PORT) : 3002;
  const host = process.env.HOST ?? "127.0.0.1";
  await app.listen(port, host);
}

void bootstrap();
