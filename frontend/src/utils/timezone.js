/**
 * East Africa Timezone Helper (EAT, UTC+3)
 * Used across the platform to align auction deadlines, displays, and countdown timers
 * with Addis Ababa / Nairobi time zone (UTC+3).
 */

export const EAT_TIMEZONE = 'Africa/Addis_Ababa';
export const EAT_OFFSET_HOURS = 3;
export const EAT_OFFSET_MS = EAT_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Parses any auction date/time value so that its UTC components
 * preserve the exact East Africa Time wall-clock figures (YYYY-MM-DD HH:mm:ss).
 *
 * @param {string|Date|number} dateValue
 * @returns {Date|null}
 */
export const parseAuctionDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) return null;
    return dateValue;
  }
  if (typeof dateValue === 'number') {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateValue).trim();
  if (!str) return null;

  // Extract YYYY-MM-DD[ T]HH:mm(:ss)?
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, y, m, d, hh, mm, ss = '00'] = match;
    return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}.000Z`);
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Computes remaining milliseconds until the auction ends.
 * Since the database stores the exact EAT wall-clock timestamp (e.g. 14:18:00),
 * the true real-world UTC deadline is (targetEAT - 3 hours).
 * Remaining ms is: (targetEAT - 3 hours) - Date.now().
 *
 * @param {string|Date|number} endTime
 * @returns {number}
 */
export const getEATRemainingMs = (endTime) => {
  const targetDate = parseAuctionDate(endTime);
  if (!targetDate || isNaN(targetDate.getTime())) return 0;
  const targetUtcMs = targetDate.getTime() - EAT_OFFSET_MS;
  return targetUtcMs - Date.now();
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

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
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
 * Formats date & time string preserving the exact East Africa Time (EAT).
 *
 * @param {string|Date|number} dateValue
 * @param {object} options
 * @returns {string}
 */
export const formatEATDateTime = (dateValue, options = {}) => {
  const date = parseAuctionDate(dateValue);
  if (!date || isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString('en-US', {
    timeZone: 'UTC', // date's UTC fields contain the exact EAT wall-clock numbers
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
  EAT_OFFSET_MS,
  parseAuctionDate,
  getEATRemainingMs,
  isAuctionEndedEAT,
  formatEATCountdown,
  formatEATTimeLeft,
  countdownColorEAT,
  formatEATDateTime,
};
