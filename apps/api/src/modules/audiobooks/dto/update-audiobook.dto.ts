import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateAudiobookDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  authorName?: string;

  @IsOptional()
  @IsString()
  narratorName?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";

  @IsOptional()
  @IsIn(["public", "private", "unlisted"])
  visibility?: "public" | "private" | "unlisted";

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
