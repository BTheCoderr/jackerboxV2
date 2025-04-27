/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency with appropriate symbol
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a date in a user-friendly way
 * @param date The date to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(dateObj);
}

/**
 * Format a duration in days/weeks
 * @param days Number of days
 * @returns Formatted duration string
 */
export function formatDuration(days: number): string {
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  if (remainingDays === 0) {
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
  
  return `${weeks} week${weeks !== 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Truncate text to a specific length and add ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format a date range as a string
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  } else if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  } else {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  }
} 