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
  columnName: string;
  text: string | boolean | number;
}

export interface SciSortCriterion {
  columnName: string;
  direction: 'asc' | 'desc';
}

export interface SciTableRequest {
  start: number; // Inclusive
  end: number; // Exclusive
  pageSize: number;
  page: number;
  sortCriteria: SciSortCriterion[];
  columnFilters: SciColumnFilter[];
  globalFilter?: string;
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

export type SciDataLoaderFn<T> = (request: SciTableRequest) => MaybeAsync<SciTableResponse<T>>;
