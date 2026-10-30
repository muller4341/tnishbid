/**
 * East Africa Timezone Helper (EAT, UTC+3)
 * Used across the platform to align auction deadlines and countdown timers
 * with Addis Ababa / Nairobi time zone.
 */

export const EAT_TIMEZONE = 'Africa/Addis_Ababa';
export const EAT_OFFSET_HOURS = 3;

/**
 * Parses any auction date/time string ensuring it is properly anchored to
 * East Africa Time (Addis Ababa / Nairobi, UTC+3).
 * 
 * If a naive datetime string is received (e.g. '2026-10-30T18:00' from datetime-local),
 * it explicitly attaches '+03:00' so that it doesn't get misconstrued by UTC
 * or local client system timezone.
 *
 * @param {string|Date|number} dateValue
 * @returns {Date|null}
 */
export const parseAuctionDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'number') return new Date(dateValue);

  const str = String(dateValue).trim();
  if (!str) return null;

  // If already contains an ISO timezone designator (Z or +HH:MM or -HH:MM), parse directly
  if (/Z|[+-]\d{2}(:?\d{2})?$/i.test(str)) {
    return new Date(str);
  }

  // Naive date string (e.g. '2026-10-30T18:00' or '2026-10-30 18:00:00')
  // Treat as East Africa Time (+03:00)
  const normalized = str.replace(' ', 'T');
  return new Date(`${normalized}+03:00`);
};

/**
 * Computes remaining milliseconds until the auction ends in EAT.
 *
 * @param {string|Date|number} endTime
 * @returns {number}
 */
export const getEATRemainingMs = (endTime) => {
  const targetDate = parseAuctionDate(endTime);
  if (!targetDate || isNaN(targetDate.getTime())) return 0;
  return targetDate.getTime() - Date.now();
};

/**
 * Checks whether an item auction has ended based on EAT end time.
 *
 * @param {object} item
 * @returns {boolean}
 */
export const isAuctionEndedEAT = (item) => {
  if (!item) return true;
  if (item.status === 'closed') return true;
  if (!item.end_time) return false;
  return getEATRemainingMs(item.end_time) <= 0;
};

/**
 * Formats countdown for auction cards (e.g. "02d : 14h : 30m : 15s" or "14h : 30m : 15s").
 *
 * @param {string|Date|number} endTime
 * @returns {string}
 */
export const formatEATCountdown = (endTime) => {
  if (!endTime) return '00h : 00m : 00s';
  const dist = getEATRemainingMs(endTime);
  if (dist <= 0) return 'Ended';

  const d = Math.floor(dist / (1000 * 60 * 60 * 24));
  const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((dist % (1000 * 60)) / 1000);
  const pad = (n) => (n < 10 ? '0' + n : n);

  if (d > 0) return `${d}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
  return `${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
};

/**
 * Formats time remaining in full words (e.g. "2d 4h 15m 30s") used on item details.
 *
 * @param {string|Date|number} endTime
 * @returns {string}
 */
export const formatEATTimeLeft = (endTime) => {
  if (!endTime) return 'EXPIRED';
  const dist = getEATRemainingMs(endTime);
  if (dist <= 0) return 'EXPIRED';

  const days = Math.floor(dist / (1000 * 60 * 60 * 24));
  const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((dist % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

/**
 * Returns countdown color class based on remaining time in EAT.
 *
 * @param {string|Date|number} endTime
 * @param {boolean} isClosed
 * @returns {string}
 */
export const countdownColorEAT = (endTime, isClosed) => {
  if (isClosed || !endTime) return 'text-red-500';
  const dist = getEATRemainingMs(endTime);
  if (dist <= 0) return 'text-red-500';
  if (dist / (1000 * 60 * 60 * 24) <= 5) return 'text-yellow-400';
  return 'text-emerald-400';
};

/**
 * Formats date & time string in Addis Ababa / Nairobi time zone (EAT, UTC+3).
 *
 * @param {string|Date|number} dateValue
 * @param {object} options
 * @returns {string}
 */
export const formatEATDateTime = (dateValue, options = {}) => {
  const date = parseAuctionDate(dateValue);
  if (!date || isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString('en-US', {
    timeZone: EAT_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  });
};

export default {
  EAT_TIMEZONE,
  EAT_OFFSET_HOURS,
  parseAuctionDate,
  getEATRemainingMs,
  isAuctionEndedEAT,
  formatEATCountdown,
  formatEATTimeLeft,
  countdownColorEAT,
  formatEATDateTime,
};
