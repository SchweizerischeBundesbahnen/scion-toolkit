/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {asapScheduler, AsyncSubject, lastValueFrom, Subject, Subscription} from 'rxjs';
import {catchError, observeOn} from 'rxjs/operators';
import {serializeExecution} from '@scion/toolkit/operators';

/**
 * Executes tasks sequentially in serial order.
 *
 * Only a single task executes at any one time. Tasks submitted while an execution is in progress are queued.
 */
export class SingleTaskExecutor {

  private readonly _task$ = new Subject<Task>();
  private readonly _subscription: Subscription;

  constructor() {
    this._subscription = this._task$
      .pipe(
        // Schedule the task asynchronously so that it is not executed if the executor is destroyed in the same "call stack",
        // happening, for example, when destroying the Testbed in unit tests. Angular destroys contexts from the bottom up,
        // i.e., child contexts are destroyed before parent contexts. If a task is scheduled in a destroy lifecycle hook of
        // a child context, the task would still be executed because the executor is not destroyed yet.
        observeOn(asapScheduler),
        serializeExecution(task => task.execute()),
        catchError((_error, caught) => caught),
      )
      .subscribe();
  }

  /**
   * Submits a task for execution.
   *
   * Returns a Promise that resolves to the result of the passed task.
   */
  public submit<T>(task: () => Promise<T>): Promise<T> {
    const ɵtask = new Task<T>(task);
    this._task$.next(ɵtask as Task);
    return ɵtask.await();
  }

  /**
   * Destroys this executor and discards any pending task.
   */
  public destroy(): void {
    this._subscription.unsubscribe();
  }
}

class Task<T = unknown> {

  private readonly _done$ = new AsyncSubject<T>();

  constructor(private _work: () => Promise<T>) {
  }

  public async execute(): Promise<void> {
    try {
      const result = await this._work();
      this._done$.next(result);
      this._done$.complete();
    }
    catch (error) {
      this._done$.error(error);
    }
  }

  public await(): Promise<T> {
    return lastValueFrom(this._done$);
  }
}
