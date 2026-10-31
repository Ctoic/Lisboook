import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateChapterDto {
  @IsString()
  audiobookId!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  chapterNumber!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSeconds!: number;

  @IsOptional()
  @IsString()
  audioAssetId?: string;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}
