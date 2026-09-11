import {SciRowActionFactoryFn, SciTableRowBinding} from '@scion/components/table';
import {SciPageableTreeDatasource, SciTreeDatasource} from './table.model';

export interface SciTreeDescriptor<T> {
  datasource: SciTreeDatasource | SciPageableTreeDatasource;
  // label: (item: unknown) => string | SciComponentDescriptor | SciTemplateDescriptor;
  label: (item: unknown) => string;
  header?: string;
  filterable?: boolean | {matcher: (text: string, context: SciNodeContext) => boolean};
  sortable?: boolean | {comparator: (a: SciNodeContext, b: SciNodeContext) => number};
  selectable?: false | 'single' | 'multi';
  showHeader?: boolean;
  wrapHeader?: boolean;
  initialSort?: 'asc' | 'desc';
  rowActions?: SciRowActionFactoryFn<T>;
  rowBindings?: SciTableRowBinding<T>[];
  /**
   * Amount of items to render before and after the viewport during virtual scrolling. Defaults to 10.
   */
  bufferSize?: number;
  pageSize?: number;
  trackBy?: (item: unknown) => unknown;
}

export interface SciNodeContext {
  item: unknown;
  label: unknown;
}
