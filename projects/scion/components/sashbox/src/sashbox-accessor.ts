import {SciSashDirective} from './sash.directive';
import {Signal} from '@angular/core';

/**
 * Allows accessing the sashbox component from sashes.
 */
export abstract class SciSashBoxAccessor {

  public abstract get sashes(): Signal<readonly SciSashDirective[]>;

  public abstract get direction(): 'column' | 'row';
}
