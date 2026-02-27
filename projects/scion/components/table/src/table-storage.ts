/**
 * Provides persistent storage for the sci-table.
 */
export abstract class SciTableStorage {

  /**
   * Method invoked to load a value from persisted storage.
   */
  public abstract load(key: string): Promise<string | null> | string | null;

  /**
   * Method invoked to write a value to persisted storage.
   */
  public abstract store(key: string, value: string): Promise<void> | void;
}

/**
 * Default storage used by the sci-table to persist data in local storage.
 *
 * Local storage maintains a persistent storage area per origin. Data does not expire and remains after the browser restarts.
 *
 * @internal
 */
export class DefaultSciTableStorage implements SciTableStorage {

  public load(key: string): string | null {
    return localStorage.getItem(key);
  }

  public store(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
}
