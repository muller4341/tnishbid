/**
 * East Africa Time (EAT, UTC+3) Helper for Backend
 * 
 * Ensures the exact wall-clock timestamp entered by the admin in EAT
 * (e.g. 2026-11-02 14:18:00) is stored directly into PostgreSQL without
 * being shifted back to UTC (e.g. 11:18:00), while auction expiration
 * logic correctly evaluates against real-world elapsed time.
 */

const EAT_OFFSET_HOURS = 3;
const EAT_OFFSET_MS = EAT_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Parses a date string ensuring the exact entered timestamp figures (YYYY-MM-DD HH:mm:ss)
 * are stored literally in PostgreSQL's TIMESTAMP(3) column via Prisma.
 *
 * @param {string|Date|number} dateStr
 * @returns {Date|null}
 */
const parseExactTimestamp = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    return dateStr;
  }
  const str = String(dateStr).trim();
  if (!str) return null;

  // Extract YYYY-MM-DD[ T]HH:mm(:ss)?
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, y, m, d, hh, mm, ss = '00'] = match;
    // By creating a Date with 'Z', its UTC components match the entered digits exactly,
    // so Prisma passes these exact digits to PostgreSQL's TIMESTAMP column.
    return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}.000Z`);
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Checks whether an auction has ended according to East Africa Time (UTC+3).
 * When end_time is stored as 14:18:00 EAT (loaded as 14:18:00.000Z),
 * the auction has ended when real-world UTC time reaches (14:18:00 - 3 hours = 11:18:00 UTC).
 *
 * @param {string|Date|number} endTime
 * @returns {boolean}
 */
const isAuctionEndedBackend = (endTime) => {
  if (!endTime) return false;
  const targetDate = parseExactTimestamp(endTime);
  if (!targetDate || isNaN(targetDate.getTime())) return false;
  // Convert EAT wall-clock time to real-world UTC moment
  const realUtcDeadline = targetDate.getTime() - EAT_OFFSET_MS;
  return realUtcDeadline <= Date.now();
};

module.exports = {
  EAT_OFFSET_HOURS,
  EAT_OFFSET_MS,
  parseExactTimestamp,
  isAuctionEndedBackend
};
