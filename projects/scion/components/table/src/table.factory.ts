import {MaybeSignal} from './common';
import {ComponentWithBindings, SciCellContext, TemplateWithContext} from './table.model';

export interface SciTableFactory<T> {
  addStringColumn(value: (item: T) => string): this;
  addStringColumn(header: MaybeSignal<string>, value: (item: T) => string): this;
  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  addBooleanColumn(value: (item: T) => boolean): this;
  addBooleanColumn(header: MaybeSignal<string>, value: (item: T) => boolean): this;
  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  addNumberColumn(value: (item: T) => number): this;
  addNumberColumn(header: MaybeSignal<string>, value: (item: T) => number): this;
  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;
  addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this;

  /**
   * TrackBy function used to optimize rendering. Defaults to tracking by index.
   */
  trackBy(trackByFn: (item: T, index: number) => unknown): this;

  /**
   * Allow rows to be filterable. Defaults to true.
   */
  sortable(sortable: boolean): this;

  /**
   * Allow rows to be filterable. Defaults to true.
   */
  filterable(filterable: boolean): this;

  /**
   * Allow rows to be resizable. Defaults to true.
   */
  resizable(resizable: boolean): this;

  /**
   * Allow rows to be selectable. Defaults to true.
   */
  selectable(selectable: boolean): this;

  /**
   * Size of row items in px. Defaults to 28px.
   */
  itemSize(itemSize: number): this;

  /**
   * Adds conditional part to row element.
   * This can be used to conditionally style the row.
   *
   * Example usage:
   * ```ts
   * table(persons, table => table.rowPart(person => !person.active ? 'inactive' : null));
   * ```
   *
   * ```scss
   * sci-table ::part(inactive) {
   *   background-color: rgba(255, 0, 0, 0.2);
   * }
   * ```
   */
  rowPart(rowPartFn: (item: T) => string | null): this;

  /**
   * Name of the table, used to save and restore view to localStorage.
   */
  name(name: string): this;
}

interface SciColumnDescriptor<T> {
  name?: string;
  header?: MaybeSignal<string>;
  resizable?: boolean;
  width?: MaybeSignal<string>;
  minWidth?: MaybeSignal<string>;
  maxWidth?: MaybeSignal<string>;
  part?: (item: T) => string;
}

export interface SciComponentColumnDescriptor<T> extends SciColumnDescriptor<T> {
  component: (item: T) => ComponentWithBindings;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, void>) => boolean) | boolean;
}

export interface SciTemplateColumnDescriptor<T> extends SciColumnDescriptor<T> {
  template: (item: T) => MaybeSignal<TemplateWithContext>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, void>) => boolean) | boolean;
}

export interface SciStringColumnDescriptor<T> extends SciColumnDescriptor<T> {
  value: (item: T) => MaybeSignal<string>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, string>) => boolean) | boolean;
}

export interface SciNumberColumnDescriptor<T> extends SciColumnDescriptor<T> {
  value: (item: T) => MaybeSignal<number>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: number, context: SciCellContext<T, number>) => boolean) | boolean;
}

export interface SciBooleanColumnDescriptor<T> extends SciColumnDescriptor<T> {
  value: (item: T) => MaybeSignal<boolean>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: boolean, context: SciCellContext<T, boolean>) => boolean) | boolean;
}
export type SciColumnDescriptors<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciComponentColumnDescriptor<T> | SciTemplateColumnDescriptor<T>;
