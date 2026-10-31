import { Controller, Get, Module } from "@nestjs/common";

@Controller()
class HealthController {
  @Get("health")
  getHealth() {
    return {
      service: "lisbook-api",
      status: "ok",
      stage: "foundation"
    };
  }
}

@Module({
  controllers: [HealthController]
})
export class HealthModule {}
