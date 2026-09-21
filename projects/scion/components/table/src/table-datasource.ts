/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MaybeAsync} from './common';
import {computed, Signal} from '@angular/core';

export interface SciTableColumnFilter {
  columnName: `column:${string}`;
  text: string | boolean | number;
}

export interface SciTableSortCriterion {
  columnName: `column:${string}`;
  direction: 'asc' | 'desc';
}

export interface SciTablePageRequest {
  page: number; // TODO [ego] Should page be 1-based?
  pageSize: number;
  start: number; // Inclusive
  end: number; // Exclusive
  sortCriteria: SciTableSortCriterion[];
  columnFilters: SciTableColumnFilter[];
  tableFilter?: string;
}

export interface SciTablePageResponse<T> {
  /**
   * Items of the requested page.
   */
  items: T[];

  /**
   * Total count of the source data, used to calculate the scroll size.
   */
  totalCount: number;
}

/**
 * @docs-private Not public API. For internal use only.
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 */
export type SciTableDataLoaderFn<T> = (request: SciTablePageRequest) => MaybeAsync<SciTablePageResponse<T>>;

/**
 * TODO [table] Remove after datasource is final.
 *
 * @docs-private Not public API. For internal use only.
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 */
export function ɵillegaldatasource<T>(): Signal<T[]> {
  return computed(() => {
    throw Error('[SciTableError] Illegal state. ɵillegaldatasource should not be used.');
  });
}
