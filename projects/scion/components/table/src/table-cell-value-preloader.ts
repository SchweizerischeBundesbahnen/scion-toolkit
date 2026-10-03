import {DestroyRef, inject, Injector, onIdle, runInInjectionContext, Service} from '@angular/core';
import {LatestTaskExecutor} from './latest-task-executor';

/**
 * Preloads cell values in the background when the browser is idle. This prevents lag with large datasets, in particular
 * for expensive computations like formatting dates and generating ISO 8601 strings, providing faster sort and filter performance.
 *
 * If a cell's value is requested before background preloading finishes, it is computed synchronously.
 */
@Service()
export class SciTableCellPreloader {

  private readonly _executor = new LatestTaskExecutor();
  private readonly _queue = new Array<() => void>();
  private readonly _injector = inject(Injector);

  constructor() {
    inject(DestroyRef).onDestroy(() => this._queue.length = 0);
  }

  /**
   * Queues specified cell value provider function for execution in the background the next time the browser is idle.
   */
  public queue(cellValueFn: () => void): void {
    this._queue.push(cellValueFn);
    this._executor.submit(() => this.whenIdle().then(() => this.preloadQueuedBatch(PRELOAD_BATCH_SIZE)));
  }

  /**
   * Preloads the next batch of queued cell values, FIFO, then, if the queue is not empty, schedules the next batch.
   */
  private async preloadQueuedBatch(batchSize: number): Promise<void> {
    this._queue.splice(0, batchSize).forEach(fn => fn());

    // const work = this._queue.splice(0, batchSize);
    // console.time(`>>> preloading ${work.length}`);
    // work.forEach(fn => fn());
    // console.timeEnd(`>>> preloading ${work.length}`);

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

/**
 * Provides lazy loading for the cell's value, preloading it when idle for better sort/filter performance.
 *
 * The value is computed at most once, whether it gets preloaded during idle time or requested synchronously via {@link value()}.
 */
export class eTableCellValue<V> {

  private _value: V | undefined;

  constructor(preloader: SciTableCellPreloader, private _valueFn: () => V) {
    preloader.queue(() => {
      this._value ??= this._valueFn();
    });
  }

  public value(): V {
    return this._value ??= this._valueFn();
  }
}

const PRELOAD_BATCH_SIZE = 50_000;
