import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

export function AdminRoute(...roles: string[]) {
  const resolvedRoles = roles.length > 0 ? roles : ["editor", "super_admin"];
  return applyDecorators(Roles(...resolvedRoles), UseGuards(AuthGuard, RolesGuard));
}
