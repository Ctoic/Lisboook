import { Test } from "@nestjs/testing";
import { AudiobooksModule } from "./audiobooks.module";

describe("AudiobooksModule", () => {
  it("compiles the audiobook module", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AudiobooksModule]
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
