import {Injectable, Signal} from '@angular/core';
import {ɵSciTableCellValuePreloader} from './ɵtable-cell-value-preloader';

/**
 * Preloads cell values in the background when the browser is idle. This prevents lag with large datasets, in particular
 * for expensive computations like formatting dates and generating ISO 8601 strings, providing faster sort and filter performance.
 *
 * If a cell's value is requested before background preloading finishes, it is computed synchronously.
 */
@Injectable({providedIn: 'root', useClass: ɵSciTableCellValuePreloader})
export abstract class SciTableCellValuePreloader {

  /**
   * Indicates whether cell values are currently preloading.
   */
  public abstract readonly loading: Signal<boolean>;

  /**
   * Queues specified cell value provider function for execution in the background the next time the browser is idle.
   */
  public abstract queue(cellValueFn: () => void): void;
}
