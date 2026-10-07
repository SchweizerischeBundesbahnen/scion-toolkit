import {computed, DestroyRef, inject, Injectable, Injector, onIdle, runInInjectionContext, signal} from '@angular/core';
import {LatestTaskExecutor} from '@scion/toolkit/common';
import {SciTableCellValuePreloader} from './table-cell-value-preloader';

/** @inheritDoc */
@Injectable()
export class ɵSciTableCellValuePreloader implements SciTableCellValuePreloader {

  private readonly _executor = new LatestTaskExecutor();
  private readonly _queue = new Array<() => void>(); // PERF: Do not change to signal to avoid array re-allocation on enqueue (expensive); queue size is tracked via a separate signal.
  private readonly _queueSize = signal(0);
  private readonly _injector = inject(Injector);

  /** @inheritDoc */
  public readonly loading = computed(() => this._queueSize() > 0);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this._executor.destroy();
      this._queue.length = 0;
      this._queueSize.set(0);
    });
  }

  /** @inheritDoc */
  public queue(cellValueFn: () => void): void {
    this._queue.push(cellValueFn);
    this._queueSize.update(size => size + 1);

    this._executor.submit(() => this.whenIdle().then(() => this.preloadQueuedBatch(PRELOAD_BATCH_SIZE)));
  }

  /**
   * Preloads the next batch of queued cell values, FIFO, then, if the queue is not empty, schedules the next batch.
   */
  private async preloadQueuedBatch(batchSize: number): Promise<void> {
    this._queue.splice(0, batchSize).forEach(fn => fn());
    this._queueSize.set(this._queue.length);

    // Preload next batch when idle again.
    if (this._queue.length) {
      this._executor.submit(() => this.whenIdle().then(() => this.preloadQueuedBatch(PRELOAD_BATCH_SIZE)));
    }
  }

  /**
   * Resolves when the browser becomes idle.
   *
   * @see onIdle
   */
  private whenIdle(): Promise<void> {
    return runInInjectionContext(this._injector, onIdle);
  }
}

const PRELOAD_BATCH_SIZE = 50_000;
