/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciBooleanColumnDescriptor, SciComponentColumnDescriptor, SciDateColumnDescriptor, SciNumberColumnDescriptor, SciStringColumnDescriptor, SciTableColumnDescriptorLike, SciTableColumnFactory, SciTemplateColumnDescriptor} from './table-column.factory';
import {SciBooleanColumn, SciColumnHeaderLike, SciComponentColumn, SciDateColumn, SciDateLike, SciNumberColumn, SciStringColumn, SciTableColumn, SciTableColumnLike, SciTemplateColumn} from './table.model';
import {computed, DEFAULT_CURRENCY_CODE, inject, signal, untracked} from '@angular/core';
import {ɵSciTable} from './ɵtable.model';
import {coerceSignal, MaybeSignal, SCI_LOCALE} from '@scion/components/common';
import {coerceDateValue} from './table-date-column.model';
import {DATE_PIPE_DEFAULT_OPTIONS} from '@angular/common';
import {text, Translatable} from '@scion/components/text';

export class ɵSciTableColumnFactory<T> implements SciTableColumnFactory<T> {

  public readonly columns = new Array<SciTableColumnLike<T>>();

  constructor(private readonly _table: ɵSciTable<T>) {
  }

  public addStringColumn(value: (item: T) => MaybeSignal<Translatable | undefined>): this;
  public addStringColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<Translatable | undefined>): this;
  public addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;
  public addStringColumn(descriptorLike: ((item: T) => MaybeSignal<string | undefined>) | SciColumnHeaderLike | SciStringColumnDescriptor<T>, value?: (item: T) => MaybeSignal<Translatable | undefined>): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);
    const sortable = descriptor.sortable ?? true;
    const filterable = descriptor.filterable ?? true;

    this.columns.push({
      ...column,
      type: 'string',
      value: item => text(coerceSignal(descriptor.value(item))),
      sortable: computed(() => this._table.sortable() && !!sortable),
      filterable: computed(() => this._table.filterable() && !!filterable),
      compare: typeof sortable === 'object' ? sortable.comparator : (a, b) => a.value.localeCompare(b.value),
      matches: typeof filterable === 'object' ? filterable.matcher : (text, context) => context.value.toLowerCase().includes(text.toLowerCase()),
    } satisfies SciStringColumn<T>);

    return this;
  }

  public addNumberColumn(value: (item: T) => MaybeSignal<number | undefined>): this;
  public addNumberColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<number | undefined>): this;
  public addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;
  public addNumberColumn(descriptorLike: ((item: T) => MaybeSignal<number | undefined>) | SciColumnHeaderLike | SciNumberColumnDescriptor<T>, value?: (item: T) => MaybeSignal<number | undefined>): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);

    const locale = coerceSignal(descriptor.locale ?? inject(SCI_LOCALE));
    const currency = inject(DEFAULT_CURRENCY_CODE, {optional: true}) ?? 'USD';
    this.columns.push({
      ...column,
      type: 'number',
      value: item => coerceSignal(descriptor.value(item), {coerceUndefined: true}),
      sortable: computed(() => this._table.sortable() && (descriptor.sortable ?? true)),
      filterable: computed(() => this._table.filterable() && (descriptor.filterable ?? true)),
      compare: (a, b) => a.value - b.value,
      matches: (text, context) => context.value === text,
      format: computed(() => new Intl.NumberFormat(locale(), {currency, ...descriptor.format})),
    } satisfies SciNumberColumn<T>);

    return this;
  }

  public addBooleanColumn(value: (item: T) => MaybeSignal<boolean | undefined>): this;
  public addBooleanColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<boolean | undefined>): this;
  public addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;
  public addBooleanColumn(descriptorLike: ((item: T) => MaybeSignal<boolean | undefined>) | SciColumnHeaderLike | SciBooleanColumnDescriptor<T>, value?: (item: T) => MaybeSignal<boolean | undefined>): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);

    this.columns.push({
      ...column,
      type: 'boolean',
      value: item => coerceSignal(descriptor.value(item), {coerceUndefined: true}),
      sortable: computed(() => this._table.sortable() && (descriptor.sortable ?? true)),
      filterable: computed(() => this._table.filterable() && (descriptor.filterable ?? true)),
      compare: (a, b) => a.value === b.value ? 0 : (a.value ? 1 : -1),
      matches: (text, context) => context.value === text,
    } satisfies SciBooleanColumn<T>);

    return this;
  }

  public addDateColumn(value: (item: T) => MaybeSignal<SciDateLike | undefined>): this;
  public addDateColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<SciDateLike | undefined>): this;
  public addDateColumn(descriptor: SciDateColumnDescriptor<T>): this;
  public addDateColumn(descriptorLike: ((item: T) => MaybeSignal<SciDateLike | undefined>) | SciColumnHeaderLike | SciDateColumnDescriptor<T>, value?: (item: T) => MaybeSignal<SciDateLike | undefined>): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);

    const defaults = inject(DATE_PIPE_DEFAULT_OPTIONS, {optional: true});
    const locale = coerceSignal(descriptor.locale ?? inject(SCI_LOCALE));
    const format = descriptor.format ?? defaults?.dateFormat ?? 'mediumDate';
    const timezone = descriptor.timezone ?? defaults?.timezone;

    this.columns.push({
      ...column,
      type: 'date',
      value: item => {
        const dateLike = coerceSignal(descriptor.value(item), {coerceUndefined: true});
        return computed(() => coerceDateValue(dateLike(), {locale: locale(), format, timezone}));
      },
      sortable: computed(() => this._table.sortable() && (descriptor.sortable ?? true)),
      filterable: computed(() => this._table.filterable() && (descriptor.filterable ?? true)),
      compare: (a, b) => a.value.millis - b.value.millis,
      matches: (text, context) => context.value.formatted.toLowerCase().includes(text.toLowerCase()),
    } satisfies SciDateColumn<T>);

    return this;
  }

  public addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this {
    // Require a filter matcher if filterable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.filterable === true) {
      throw Error('[ColumnDefinitionError] Component column requires a filter matcher in order to be filterable.');
    }

    // Require a sort comparator if sortable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.sortable === true) {
      throw Error('[ColumnDefinitionError] Component column requires a sort comparator in order to be sortable.');
    }

    const column = this.mapToColumn(descriptor);
    this.columns.push({
      ...column,
      type: 'component',
      component: descriptor.component,
      sortable: computed(() => this._table.sortable() && !!descriptor.sortable),
      filterable: computed(() => this._table.filterable() && !!descriptor.filterable),
      compare: typeof descriptor.sortable === 'object' ? descriptor.sortable.comparator : () => 0,
      matches: typeof descriptor.filterable === 'object' ? descriptor.filterable.matcher : () => false,
      padding: descriptor.padding ?? true,
    } satisfies SciComponentColumn<T>);

    return this;
  }

  public addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this {
    // Require a filter matcher if filterable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.filterable === true) {
      throw Error('[ColumnDefinitionError] Template column requires a filter matcher in order to be filterable.');
    }

    // Require a sort comparator if sortable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.sortable === true) {
      throw Error('[ColumnDefinitionError] Template column requires a sort comparator in order to be sortable.');
    }

    const column = this.mapToColumn(descriptor);
    this.columns.push({
      ...column,
      type: 'template',
      template: descriptor.template,
      sortable: computed(() => this._table.sortable() && !!descriptor.sortable),
      filterable: computed(() => this._table.filterable() && !!descriptor.filterable),
      compare: typeof descriptor.sortable === 'object' ? descriptor.sortable.comparator : () => 0,
      matches: typeof descriptor.filterable === 'object' ? descriptor.filterable.matcher : () => false,
      padding: descriptor.padding ?? true,
    } satisfies SciTemplateColumn<T>);

    return this;
  }

  /**
   * Maps given column descriptor to a {@link SciTableColumn}.
   */
  private mapToColumn(descriptor: SciTableColumnDescriptorLike<T>): Omit<SciTableColumn, 'type' | 'sortable' | 'filterable' | 'compare' | 'matches'> {
    // Require a unique column name.
    const name = descriptor.name ?? `column:${this.columns.length}`;
    if (this.columns.find(column => column.name === name)) {
      throw Error(`[ColumnDefinitionError] Column names must be unique. "${name}" is defined more than once.`);
    }

    // Disallow a filter matcher if using a custom datasource.
    if (!this._table.isArrayDatasource() && typeof descriptor.filterable === 'object') {
      throw Error('[ColumnDefinitionError] Configuring a filter matcher is not supported for tables using a datasource. Filtering must be done by the datasource.');
    }

    // Disallow a sort comparator if using a custom datasource.
    if (!this._table.isArrayDatasource() && typeof descriptor.sortable === 'object') {
      throw Error('[ColumnDefinitionError] Configuring a sort comparator is not supported for tables using a datasource. Sorting must be done by the datasource.');
    }

    return {
      name: name,
      header: untracked(() => {
        if (typeof descriptor.header === 'string') {
          return {label: text(descriptor.header), icon: undefined, tooltip: undefined};
        }
        return {
          label: descriptor.header?.label !== undefined ? text(descriptor.header.label) : undefined,
          icon: descriptor.header?.icon,
          tooltip: descriptor.header?.tooltip !== undefined ? text(descriptor.header.tooltip) : undefined,
        };
      }),
      resizable: computed(() => this._table.resizable() && (descriptor.resizable ?? true)),
      width: computed(() => {
        const userSettings = this._table.userSettings().columns?.find(column => column.name === name);
        return userSettings?.width ? `${userSettings.width}px` : descriptor.width ?? '1fr';
      }),
      minWidth: descriptor.minWidth ?? 100,
      resizing: signal(false),
      padding: true,
      location: {x: 0, width: 0}, // set in `SciTableColumnComponent`
    };
  }
}

/**
 * Coerces given column factory arguments to a {@link SciTableColumnDescriptorLike}.
 */
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => MaybeSignal<string | undefined>) | SciColumnHeaderLike | SciStringColumnDescriptor<T>, value?: (item: T) => MaybeSignal<string | undefined>): SciStringColumnDescriptor<T>;
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => MaybeSignal<number | undefined>) | SciColumnHeaderLike | SciNumberColumnDescriptor<T>, value?: (item: T) => MaybeSignal<number | undefined>): SciNumberColumnDescriptor<T>;
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => MaybeSignal<boolean | undefined>) | SciColumnHeaderLike | SciBooleanColumnDescriptor<T>, value?: (item: T) => MaybeSignal<boolean | undefined>): SciBooleanColumnDescriptor<T>;
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => MaybeSignal<SciDateLike | undefined>) | SciColumnHeaderLike | SciDateColumnDescriptor<T>, value?: (item: T) => MaybeSignal<SciDateLike | undefined>): SciDateColumnDescriptor<T>;
function coerceColumnDescriptor(argument1: unknown, argument2?: unknown): unknown {
  if (argument2 === undefined) {
    return typeof argument1 === 'function' ? {value: argument1} : argument1;
  }
  return {
    header: argument1,
    value: argument2,
  };
}
