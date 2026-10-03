import {formatDate} from '@angular/common';

export function coerceDateValue(dateLike: string | number | Date, options: {format: string; locale: string; timezone?: string}): SciDateValue {
  const {format, locale, timezone} = options;

  switch (typeof dateLike) {
    case 'string': {
      const isoString = dateLike;
      return {
        isoString,
        millis: new Date(isoString).getTime(),
        formatted: formatDate(isoString, format, locale, timezone), // expensive
      };
    }
    case 'number': {
      const millis = dateLike;
      const isoString = new Date(millis).toISOString();
      return {
        isoString,
        millis,
        formatted: formatDate(isoString, format, locale, timezone), // expensive
      };
    }
    case 'object': {
      const date = dateLike;
      const isoString = date.toISOString();
      return {
        isoString,
        millis: date.getTime(),
        formatted: formatDate(isoString, format, locale, timezone), // expensive
      };
    }
  }
}

export type SciDateLike = string | number | Date;

export interface SciDateValue {
  /**
   * ISO 8601 string
   */
  isoString: string;
  /**
   * milliseconds since epoch
   */
  millis: number;
  /**
   * human-readable
   */
  formatted: string;
}
