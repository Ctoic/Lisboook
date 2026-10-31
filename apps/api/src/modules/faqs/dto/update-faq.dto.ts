import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  question?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  answer?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";
}
