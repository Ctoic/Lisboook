import { Injectable } from "@nestjs/common";

export interface StoredAssetDescriptor {
  key: string;
  url: string;
  provider: "local";
}

@Injectable()
export class LocalStorageService {
  private readonly root = "/uploads";

  describe(key: string): StoredAssetDescriptor {
    return {
      key,
      url: `${this.root}/${key}`,
      provider: "local"
    };
  }
}
