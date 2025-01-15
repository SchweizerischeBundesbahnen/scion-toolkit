import {SciSashDirective} from './sash.directive';
import {Signal} from '@angular/core';

/**
 * Allows accessing the sashbox component from sashes.
 */
export abstract class SciSashBoxAccessor {

  public abstract readonly sashes: Signal<readonly SciSashDirective[]>;

  public abstract readonly direction: Signal<'column' | 'row'>;
}
