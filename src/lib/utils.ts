import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLinhCanType(linhCan: string | null | undefined): string {
  if (!linhCan) return "???";
  return linhCan.split('(')[0].replace(/Linh Căn|Song|Tam|Tứ|Ngũ/g, '').replace(/-/g, ' ').trim();
}

export function formatLinhCanPurity(linhCan: string | null | undefined, purity: number | null | undefined): string {
  if (!linhCan) return "";
  let base = 'Đơn';
  if (linhCan.includes('(')) base = linhCan.split('(')[1].replace(')', '');
  else if (linhCan.includes('Song')) base = 'Song';
  else if (linhCan.includes('Tam')) base = 'Tam';
  else if (linhCan.includes('Tứ')) base = 'Tứ';
  else if (linhCan.includes('Ngũ')) base = 'Ngũ';
  
  return `${base} (${purity || 0}%)`;
}

