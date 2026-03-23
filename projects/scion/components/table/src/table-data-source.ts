import {MaybeAsync} from './common';

export interface SciFilterCriterion {
  columnName: string;
  text: string | boolean | number;
}

export interface SciSortCriterion {
  columnName: string;
  direction: 'asc' | 'desc';
}

export interface SciTableRequest {
  start: number;
  end: number;
  limit: number;
  sortCriteria: SciSortCriterion[];
  filterCriteria: SciFilterCriterion[];
}

export interface SciTableResponse<T> {
  items: T[];
  totalCount: number;
}

export interface SciDataSource<T, ID = T> {
  getItems(request: SciTableRequest): MaybeAsync<SciTableResponse<T>>;
  identity(item: T): ID;
}
