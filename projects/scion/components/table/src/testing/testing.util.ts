import {exhaustMap, firstValueFrom, pairwise, timer} from 'rxjs';
import {filter, map} from 'rxjs/operators';

// TODO [dani] Exclude from published NPM artefact, also PO's

/**
 * Waits for a value to become stable.
 *
 * This function returns the value if it hasn't changed during `probeInterval` (defaults to 100ms).
 */
export async function waitUntilStable<A>(value: () => Promise<A> | A, options?: {isStable?: (previous: A, current: A) => boolean; probeInterval?: number}): Promise<A> {
  if (options?.probeInterval === 0) {
    return value();
  }

  const value$ = timer(0, options?.probeInterval ?? 50)
    .pipe(
      exhaustMap(async () => await value()),
      pairwise(),
      filter(([previous, current]) => options?.isStable ? options.isStable(previous, current) : previous === current),
      map(([previous]) => previous),
    );
  return firstValueFrom(value$);
}
