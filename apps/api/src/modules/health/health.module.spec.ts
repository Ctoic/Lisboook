import { Test } from "@nestjs/testing";
import { HealthModule } from "./health.module";

describe("HealthModule", () => {
  it("boots the health module", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule]
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
