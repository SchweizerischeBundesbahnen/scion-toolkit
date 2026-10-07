/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Executes tasks in serial order with a queue size of 1.
 *
 * Unlike {@link SingleTaskExecutor}, this executor has a queue size of 1, with only the most recently scheduled task being queued.
 *
 * At most one task executes concurrently, and at most one task is pending. Submitting a new task replaces any currently queued task.
 */
export class LatestTaskExecutor {

  private _executing = false;
  private _latestTask: (() => Promise<void>) | undefined;

  /**
   * Submits a task for execution.
   */
  public submit(task: () => Promise<void>): void {
    this._latestTask = task;
    this.executeLatestTask();
  }

  /**
   * Executes the last task in the queue (if any).
   * After completion, this process is repeated until the task queue is empty.
   */
  private executeLatestTask(): void {
    if (this._executing || !this._latestTask) {
      return;
    }

    const task = this._latestTask;
    this._latestTask = undefined;

    this._executing = true;
    void task().finally(() => {
      this._executing = false;
      this.executeLatestTask();
    });
  }

  /**
   * Destroys this executor and discards any pending task.
   */
  public destroy(): void {
    this._latestTask = undefined;
  }
}
