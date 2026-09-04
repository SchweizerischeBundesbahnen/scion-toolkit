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

export interface SciColumnFilter {
  columnName: `column:${string}`;
  text: string | boolean | number;
}

export interface SciSortCriterion {
  columnName: `column:${string}`;
  direction: 'asc' | 'desc';
}

export interface SciTableRequest {
  start: number; // Inclusive
  end: number; // Exclusive
  pageSize: number;
  page: number; // TODO [egob] Should page be 1-based?
  sortCriteria: SciSortCriterion[];
  columnFilters: SciColumnFilter[];
  globalFilter?: string; // TODO [egob] still supported? I think yes, but consider renaming it to tableFilter
}

export interface SciTableResponse<T> {
  /**
   * Items of the requested page.
   */
  items: T[];

  /**
   * Total count of the source data, used to calculate the scroll size.
   */
  totalCount: number;
}

// TODO [dwie] Consider adding SciTable prefix
export type SciDataLoaderFn<T> = (request: SciTableRequest) => MaybeAsync<SciTableResponse<T>>;
