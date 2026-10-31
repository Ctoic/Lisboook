import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateAudiobookDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsString()
  @MinLength(2)
  authorName!: string;

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
