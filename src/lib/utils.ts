import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to combine class names.
 * - Uses `clsx` to conditionally join class names.
 * - Resolves Tailwind CSS class conflicts with `tailwind-merge`.
 *
 * @param inputs - Array of class values to combine.
 * @returns A single merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
