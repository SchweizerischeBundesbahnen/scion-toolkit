import {SciSashDirective} from './sash.directive';
import {Observable} from 'rxjs';

/**
 * Allows accessing the sashbox component from sashes.
 */
export abstract class SciSashBoxAccessor {

  public abstract get sashes(): SciSashDirective[];

  public abstract get sashes$(): Observable<SciSashDirective[]>;

  public abstract get direction(): 'column' | 'row';
}
