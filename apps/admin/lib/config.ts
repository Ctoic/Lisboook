export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3002/v1";

export const ADMIN_STORAGE_KEY = "lisbook.admin.session";
