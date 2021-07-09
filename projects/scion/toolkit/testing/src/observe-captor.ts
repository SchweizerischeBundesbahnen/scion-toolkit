import {AsyncSubject, Observer, ReplaySubject, throwError} from 'rxjs';
import {take, timeoutWith} from 'rxjs/operators';

/**
 * Allows capturing emissions of an Observable.
 */
export class ObserveCaptor<T = any, R = T> implements Observer<T> {

  private readonly _projectFn: (value: T) => R;

  private _values: R[] = [];
  private _completed = false;
  private _error: any;

  private _completeOrError$ = new AsyncSubject<void>();
  private _emitCount$ = new ReplaySubject<void>(Infinity);

  /**
   * Constructs this captor. Optionally, you can provide a project function to map emitted values.
   */
  constructor(projectFn?: (value: T) => R) {
    this._projectFn = projectFn || ((value) => value as any);
  }

  /**
   * @docs-private
   *
   * Note: Write as arrow function to retain the `this` reference when being invoked from another scope, e.g., from the global scope.
   */
  public next = (value: T): void => {
    this._values.push(this._projectFn(value));
    this._emitCount$.next();
  }

  /**
   * @docs-private
   *
   * Note: Write as arrow function to retain the `this` reference when being invoked from another scope, e.g., from the global scope.
   */
  public error = (error: any): void => {
    this._error = error;
    this._completeOrError$.complete();
  }

  /**
   * @docs-private
   *
   * Note: Write as arrow function to retain the `this` reference when being invoked from another scope, e.g., from the global scope.
   */
  public complete = (): void => {
    this._completed = true;
    this._completeOrError$.complete();
  }

  /**
   * Returns captured values in the order as emitted by the Observable.
   */
  public getValues(): R[] {
    return this._values;
  }

  /**
   * Returns the last captured value, if any.
   */
  public getLastValue(): R {
    return this._values[this._values.length - 1];
  }

  /**
   * Returns the error if the Observable errored.
   */
  public getError(): any {
    return this._error;
  }

  /**
   * Indicates if the Observable completed. An Observable can either complete or error.
   */
  public hasCompleted(): boolean {
    return this._completed;
  }

  /**
   * Indicates if the Observable errored. An Observable can either complete or error.
   */
  public hasErrored(): boolean {
    return this._error !== undefined;
  }

  /**
   * Resets captured values. The emit counter is not reset.
   *
   * @deprecated since version 11.0.0-beta.10. Use {@link reset} instead.
   */
  public resetValues(): void {
    this._values = [];
  }

  /**
   * Resets this captor.
   *
   * Pass options to control which aspects of this captor not to reset. By default, all aspects are reset.
   */
  public reset(options?: {resetValues?: boolean, resetEmitCount?: boolean}): this {
    const resetValues = options?.resetValues ?? true;
    const resetEmitCount = options?.resetEmitCount ?? true;

    if (resetValues) {
      this._values = [];
    }
    if (resetEmitCount) {
      this._emitCount$.error('[CaptorError] Captor has been reset.');
      this._emitCount$ = new ReplaySubject<void>(Infinity);
    }
    return this;
  }

  /**
   * Waits until the Observable emits the given number of items, or throws if the given timeout elapses.
   */
  public async waitUntilEmitCount(count: number, timeout: number = 5000): Promise<void> {
    return this._emitCount$
      .pipe(
        take(count),
        timeoutWith(new Date(Date.now() + timeout), throwError('[CaptorTimeoutError] Timeout elapsed.')),
      )
      .toPromise();
  }

  /**
   * Waits until the Observable completes or errors.
   */
  public async waitUntilCompletedOrErrored(): Promise<void> {
    return this._completeOrError$.toPromise();
  }
}
