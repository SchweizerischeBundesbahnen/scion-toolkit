import {formatDate} from '@angular/common';

/**
 * Creates a {@link SciDateValue} from the given date-like input.
 *
 * Calling this function is expensive due to date parsing and formatting.
 */
export function coerceDateValue(dateLike: string | number | Date | undefined, options: {format: string; locale: string; timezone?: string}): SciDateValue | undefined {
  const {format, locale, timezone} = options;

  switch (typeof dateLike) {
    case 'string': {
      const isoString = ensureIso8601DatePrefix(dateLike);
      return {
        isoString,
        millis: new Date(isoString).getTime(),
        formatted: formatDate(isoString, format, locale, timezone),
      };
    }
    case 'number': {
      const millis = dateLike;
      const isoString = new Date(millis).toISOString();
      return {
        isoString,
        millis,
        formatted: formatDate(isoString, format, locale, timezone),
      };
    }
    case 'object': {
      const date = dateLike;
      const isoString = date.toISOString();
      return {
        isoString,
        millis: date.getTime(),
        formatted: formatDate(isoString, format, locale, timezone),
      };
    }
    case 'undefined': {
      return undefined;
    }
  }
}

/**
 * Prepends '1970-01-01' if the date prefix is missing, as required by {@link formatDate}.
 *
 * Uses fast ASCII character code checks (`-`, `T`, `t`) to avoid string allocation.
 */
function ensureIso8601DatePrefix(isoDate: string): string {
  // Check if iso string already starts with a full year date (YYYY-MM-DD)
  if (isoDate.charCodeAt(4) === 45) { // '-'
    return isoDate;
  }

  // Prepend epoch, adding 'T' separator if missing.
  switch (isoDate.charCodeAt(0)) {
    case 84: // 'T'
    case 116: // 't'
      return '1970-01-01' + isoDate;
    default:
      return '1970-01-01T' + isoDate;
  }
}

/**
 * Represents the internal value of {@link SciDateColumn}.
 */
export interface SciDateValue {
  /**
   * Full ISO 8601 date/time string.
   */
  isoString: string;
  /**
   * Milliseconds since UTC epoch.
   */
  millis: number;
  /**
   * Human-readable formatted date and time string.
   */
  formatted: string;
}
