import { Test } from "@nestjs/testing";
import { PagesModule } from "./pages.module";

describe("PagesModule", () => {
  it("compiles the pages module", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PagesModule]
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
