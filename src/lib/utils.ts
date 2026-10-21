import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(countryCode?: string | null): string {
  if (countryCode === 'united-kingdom') return '£'
  if (countryCode === 'canada' || countryCode === 'united-states') return '$'
  return '$'
}

export function getCurrencyCode(countryCode?: string | null): string {
  if (countryCode === 'united-kingdom') return 'GBP'
  if (countryCode === 'canada') return 'CAD'
  if (countryCode === 'united-states') return 'USD'
  return 'USD'
}

/** Minimum annual revenue (in the charity's own local currency) to be above the eligibility threshold. */
export function getRevenueThreshold(countryCode?: string | null): number {
  if (countryCode === 'united-kingdom') return 400_000
  if (countryCode === 'canada') return 700_000
  if (countryCode === 'united-states') return 500_000
  return 500_000
}
