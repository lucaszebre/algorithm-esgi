/**
 * Small display helpers shared by the pages.
 */
import type { Product } from '../types';

const priceFormat = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

/** `89.99` → `€89.99`. */
export function formatPrice(price: number): string {
  return priceFormat.format(price);
}

/** Rating out of 5 as stars, rounded to the nearest whole star: `4.2` → `★★★★☆`. */
export function formatStars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

/** Human-readable stock status. */
export function formatStock(stock: Product['stock']): string {
  if (stock === 0) return 'Out of stock';
  if (stock < 10) return `Only ${stock} left`;
  return `In stock (${stock})`;
}
