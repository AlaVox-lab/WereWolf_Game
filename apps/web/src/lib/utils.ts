import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gộp lớp Tailwind — hàm các component kéo từ registry shadcn đều gọi. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
