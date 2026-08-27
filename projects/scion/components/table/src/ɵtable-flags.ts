import {InjectionToken} from '@angular/core';

/**
 * DI token to enable internal table flags.
 */
export const ɵSCI_TABLE_FLAGS = new InjectionToken<ɵSciTableFlags>('SCI_TABLE_FLAGS');

/**
 * Flags to control internal behaviors of {@link SciTableComponent}.
 *
 * @docs-private Not public API. For internal use only.
 */
export interface ɵSciTableFlags {
  /**
   * Controls if to add the `data-row-index` attribute to `<sci-table-row>`.
   */
  rowIndexAttribute?: true;
}
