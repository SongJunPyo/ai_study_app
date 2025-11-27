// Spaced Repetition Date Calculation Utilities

/**
 * Calculate next review date based on review count
 * @param reviewCount - Current review count (0-based)
 * @returns Next review date
 */
export const calculateNextReviewDate = (reviewCount: number): Date => {
  const today = new Date();
  let daysToAdd = 0;

  switch (reviewCount) {
    case 0:
      daysToAdd = 1; // 1st review: 1 day later
      break;
    case 1:
      daysToAdd = 3; // 2nd review: 3 days later
      break;
    case 2:
      daysToAdd = 7; // 3rd review: 7 days later
      break;
    case 3:
      daysToAdd = 14; // 4th review: 14 days later
      break;
    case 4:
      daysToAdd = 30; // 5th review: 30 days later
      break;
    default:
      daysToAdd = 30; // 6th+ review: 30 days later
      break;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate;
};

/**
 * Format date as YYYY.MM.DD
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
};

/**
 * Format date as YYYY-MM-DD (for API)
 * @param date - Date to format
 * @returns ISO date string
 */
export const formatDateISO = (date: Date | string): string => {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Calculate days until next review
 * @param nextReviewDate - Next review date
 * @returns Days until next review (negative if overdue)
 */
export const getDaysUntilReview = (nextReviewDate: Date | string): number => {
  if (!nextReviewDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);

  const diffTime = reviewDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Check if material is due for review today
 * @param nextReviewDate - Next review date
 * @returns True if due for review
 */
export const isDueForReview = (nextReviewDate: Date | string): boolean => {
  if (!nextReviewDate) return false;

  const daysUntil = getDaysUntilReview(nextReviewDate);
  return daysUntil <= 0;
};
