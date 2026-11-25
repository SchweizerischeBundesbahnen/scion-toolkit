/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertNotInReactiveContext, computed, DestroyableInjector, inject, Injector, ResourceRef, runInInjectionContext, signal, Signal, untracked} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {ɵcreateDestroyableInjector} from '@scion/components/common';
import {Observables} from '@scion/toolkit/util';
import {catchError, finalize, MonoTypeOperatorFunction, noop} from 'rxjs';
import {SciTreeTableDatasource} from './table-datasource';

export class SciTableItemLoader<T, ID> {

  private readonly _injector: DestroyableInjector;
  private readonly _trackBy: (item: T) => ID;

  private readonly _pageById = signal(new Map<ID, ResourceRef<T[]>>());
  private readonly _pages = computed(() => [...new Set(this._pageById().values())]);

  public readonly isLoading = computed(() => this._pages().some(page => page.isLoading()));
  public readonly isError = computed(() => this._pages().some(page => page.status() === 'error'));

  constructor(private _datasource: SciTreeTableDatasource<T, ID>, options: {trackBy: (item: T) => ID; injector?: Injector}) {
    this._injector = ɵcreateDestroyableInjector({parent: options.injector ?? inject(Injector)});
    this._trackBy = options.trackBy;
  }

  public getItem(id: ID): Signal<T | undefined> {
    return computed(() => {
      const page = this._pageById().get(id);
      return page?.status() !== 'error' ? page?.value().find(item => this._trackBy(item) === id) : undefined;
    });
  }

  public loadItems(ids: ID[]): {cancel: () => void} {
    assertNotInReactiveContext(this.loadItems);

    const idsToLoad = ids.filter(id => !this._pageById().has(id));
    if (!idsToLoad.length) {
      return {cancel: noop};
    }

    const page = rxResource({
      stream: () => {
        // Injector for the datasource call; destroyed on stream completion to clean up allocated resources.
        const datasourceInjector = ɵcreateDestroyableInjector({parent: this._injector});
        return runInInjectionContext(datasourceInjector, () => Observables.coerce(this._datasource.getItems(idsToLoad))).pipe(
          logError(),
          finalize(() => datasourceInjector.destroy()),
        );
      },
      injector: this._injector,
      defaultValue: [],
    });

    this._pageById.update(pages => {
      const newPages = new Map<ID, ResourceRef<T[]>>(pages);
      idsToLoad.forEach(id => newPages.set(id, page));
      return newPages;
    });

    return {
      cancel: () => untracked(() => {
        if (page.isLoading()) {
          this.delete(page);
        }
      }),
    };
  }

  private delete(page: ResourceRef<T[]>): void {
    assertNotInReactiveContext(this.delete);

    this._pageById.update(cache => {
      const cacheCopy = new Map(cache);

      for (const [id, pageResource] of cacheCopy.entries()) {
        if (page === pageResource) {
          cacheCopy.delete(id);
        }
      }
      page.destroy();
      return cacheCopy;
    });
  }

  public reloadFailed(): void {
    assertNotInReactiveContext(this.reloadFailed);

    this._pages()
      .filter(page => page.status() === 'error')
      .forEach(page => page.reload());
  }

  public clear(): void {
    assertNotInReactiveContext(this.clear);

    this._pages().forEach(page => page.destroy());
    this._pageById.set(new Map());
  }

  public dispose(): void {
    assertNotInReactiveContext(this.dispose);

    this.clear();
    this._injector.destroy();
  }
}

// TODO [ask etienne] required? Wouldn't it be better to have an effect on error at a single place
function logError<T>(): MonoTypeOperatorFunction<T> {
  return catchError(error => {
    console.error(error);
    throw error;
  });
}
