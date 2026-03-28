import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Spring `ApiErrorResponse`: use `details` when present, else `message`. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const d = error.response?.data as {
    message?: string;
    details?: Record<string, string>;
  };
  if (d?.details && typeof d.details === "object") {
    const first = Object.values(d.details).find((x) => typeof x === "string" && x.trim());
    if (first) return first;
  }
  if (typeof d?.message === "string" && d.message.trim()) return d.message;
  return fallback;
}

/** Only allow in-app paths (prevents open redirects). */
export function getSafeInternalPath(nextParam: string | null): string | null {
  if (nextParam == null || typeof nextParam !== "string") return null;
  try {
    const decoded = decodeURIComponent(nextParam.trim());
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
    if (decoded.includes("://")) return null;
    return decoded;
  } catch {
    return null;
  }
}
