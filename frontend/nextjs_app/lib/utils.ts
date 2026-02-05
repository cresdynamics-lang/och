import { type ClassValue, clsx } from 'clsx'

/**
 * Utility function to merge class names
 * Uses clsx to combine class values
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
