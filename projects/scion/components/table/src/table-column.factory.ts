/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciColumnHeaderLike, SciDateLike, SciEnumColumnValues, SciEnumValueLike, SciIconColumnValues, SciTableCellContext, SciTableColumnType} from './table.model';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';

export interface SciTableColumnFactory<T> {

  /**
   * Adds a column to the table for displaying text.
   *
   * The value can be plain text or a translation key. A translation key starts with the percent symbol (`%`)
   * and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addStringColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<Translatable | undefined>): this;

  /**
   * Adds a column to the table for displaying text.
   *
   * The value can be plain text or a translation key. A translation key starts with the percent symbol (`%`)
   * and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addStringColumn(value: (item: T) => MaybeSignal<Translatable | undefined>): this;

  /**
   * Adds a column to the table for displaying text.
   */
  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  /**
   * Adds a column to the table for displaying numeric values.
   *
   * ### Tabular Figures
   * Numbers are rendered using tabular (fixed-width) figures to align digits vertically in fonts with varying character widths. Has no effect on monospaced fonts.
   *
   * Tabular figures include digits (0-9), basic math symbols, and punctuations/spaces.
   *
   * To disable tabular figures using CSS:
   *
   * ```scss
   * // Disable tabular figures for all number columns.
   * sci-table::part(column\:number) {
   *   font-variant-numeric: normal;
   * }
   *
   * // Disable tabular figures for a specific column (replace `column-name` with the column's name).
   * sci-table::part(column\:column-name) {
   *   font-variant-numeric: normal;
   * }
   * ```
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addNumberColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<number | undefined>): this;

  /**
   * Adds a column to the table for displaying numeric values.
   *
   * ### Tabular Figures
   * Numbers are rendered using tabular (fixed-width) figures to align digits vertically in fonts with varying character widths. Has no effect on monospaced fonts.
   *
   * Tabular figures include digits (0-9), basic math symbols, and punctuations/spaces.
   *
   * To disable tabular figures using CSS:
   *
   * ```scss
   * // Disable tabular figures for all number columns.
   * sci-table::part(column\:number) {
   *   font-variant-numeric: normal;
   * }
   *
   * // Disable tabular figures for a specific column (replace `column-name` with the column's name).
   * sci-table::part(column\:column-name) {
   *   font-variant-numeric: normal;
   * }
   * ```
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addNumberColumn(value: (item: T) => MaybeSignal<number | undefined>): this;

  /**
   * Adds a column to the table for displaying numeric values.
   *
   * ### Tabular Figures
   * Numbers are rendered using tabular (fixed-width) figures to align digits vertically in fonts with varying character widths. Has no effect on monospaced fonts.
   *
   * Tabular figures include digits (0-9), basic math symbols, and punctuations/spaces.
   *
   * To disable tabular figures using CSS:
   *
   * ```scss
   * // Disable tabular figures for all number columns.
   * sci-table::part(column\:number) {
   *   font-variant-numeric: normal;
   * }
   *
   * // Disable tabular figures for a specific column (replace `column-name` with the column's name).
   * sci-table::part(column\:column-name) {
   *   font-variant-numeric: normal;
   * }
   * ```
   */
  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  /**
   * Adds a column to the table for displaying boolean values.
   *
   * Cells display `true` as a checkmark and `false` as an 'X'. Filter options are labeled as 'Yes'/'No'.
   * For custom display or filter options, use {@link addEnumColumn} instead.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addBooleanColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<boolean | undefined>): this;

  /**
   * Adds a column to the table for displaying boolean values.
   *
   * Cells display `true` as a checkmark and `false` as an 'X'. Filter options are labeled as 'Yes'/'No'.
   * For custom display or filter options, use {@link addEnumColumn} instead.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addBooleanColumn(value: (item: T) => MaybeSignal<boolean | undefined>): this;

  /**
   * Adds a column to the table for displaying boolean values.
   *
   * Cells display `true` as a checkmark and `false` as an 'X'. Filter options are labeled as 'Yes'/'No'.
   * For custom display or filter options, use {@link addEnumColumn} instead.
   */
  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  /**
   * Adds a column to the table for displaying dates, times, or both.
   *
   * Supports ISO 8601 date/time strings, milliseconds since the UTC epoch, and `Date` objects.
   *
   * Dates are formatted using `mediumDate`, or as specified in {@link DATE_PIPE_DEFAULT_OPTIONS}.
   *
   * ### Tabular Figures
   * Dates are rendered using tabular (fixed-width) figures to align digits vertically in fonts with varying character widths. Has no effect on monospaced fonts.
   *
   * Tabular figures include digits (0-9), basic math symbols, and punctuations/spaces.
   *
   * To disable tabular figures using CSS:
   *
   * ```scss
   * // Disable tabular figures for all date columns.
   * sci-table::part(column\:date) {
   *   font-variant-numeric: normal;
   * }
   *
   * // Disable tabular figures for a specific column (replace `column-name` with the column's name).
   * sci-table::part(column\:column-name) {
   *   font-variant-numeric: normal;
   * }
   * ```
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addDateColumn(header: SciColumnHeaderLike, value: (item: T) => MaybeSignal<SciDateLike | undefined>): this;

  /**
   * Adds a column to the table for displaying dates, times, or both.
   *
   * Supports ISO 8601 date/time strings, milliseconds since the UTC epoch, and `Date` objects.
   *
   * Dates are formatted using `mediumDate`, or as specified in {@link DATE_PIPE_DEFAULT_OPTIONS}.
   *
   * ### Tabular Figures
   * Dates are rendered using tabular (fixed-width) figures to align digits vertically in fonts with varying character widths. Has no effect on monospaced fonts.
   *
   * Tabular figures include digits (0-9), basic math symbols, and punctuations/spaces.
   *
   * To disable tabular figures using CSS:
   *
   * ```scss
   * // Disable tabular figures for all date columns.
   * sci-table::part(column\:date) {
   *   font-variant-numeric: normal;
   * }
   *
   * // Disable tabular figures for a specific column (replace `column-name` with the column's name).
   * sci-table::part(column\:column-name) {
   *   font-variant-numeric: normal;
   * }
   * ```
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  addDateColumn(value: (item: T) => MaybeSignal<SciDateLike | undefined>): this;

  /**
   * Adds a column to the table for displaying dates, times, or both.
   *
   * Supports ISO 8601 date/time strings, milliseconds since the UTC epoch, and `Date` objects.
   *
   * Dates are formatted as specified in {@link SciDateColumnDescriptor.format}, {@link SciDateColumnDescriptor.locale}, and {@link SciDateColumnDescriptor.timezone}.
   *
   * ### Tabular Figures
   * Dates are rendered using tabular (fixed-width) figures to align digits vertically in fonts with varying character widths. Has no effect on monospaced fonts.
   *
   * Tabular figures include digits (0-9), basic math symbols, and punctuations/spaces.
   *
   * To disable tabular figures using CSS:
   *
   * ```scss
   * // Disable tabular figures for all date columns.
   * sci-table::part(column\:date) {
   *   font-variant-numeric: normal;
   * }
   *
   * // Disable tabular figures for a specific column (replace `column-name` with the column's name).
   * sci-table::part(column\:column-name) {
   *   font-variant-numeric: normal;
   * }
   * ```
   */
  addDateColumn(descriptor: SciDateColumnDescriptor<T>): this;

  /**
   * Adds a column to the table for displaying values of an enumeration.
   */
  addEnumColumn(descriptor: SciEnumColumnDescriptor<T>): this;

  /**
   * Adds a column to the table for displaying icons.
   */
  addIconColumn(descriptor: SciIconColumnDescriptor<T>): this;

  /**
   * Adds a column to the table for displaying custom content using a component.
   */
  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;

  /**
   * Adds a column to the table for displaying custom content using a template.
   */
  addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this;
}

export interface SciTableColumnDescriptor {
  name?: `column:${string}`;
  header?: SciColumnHeaderLike;
  resizable?: boolean;
  /**
   * Shows the expand/collapse control in this column for hierarchical rows. Defaults to `true` for the first column.
   */
  showExpansionControl?: boolean;
  /**
   * Preferred column size.
   * Value which can be used inside `grid-template-columns` definition. Defaults to 1fr.
   * Examples: `1fr`, `max-content`, `100px`.
   */
  width?: string;
  /**
   * Min column width in px. Defaults to 100.
   */
  minWidth?: number;
}

/**
 * Configures a table column for displaying text.
 */
export interface SciStringColumnDescriptor<T> extends SciTableColumnDescriptor {

  /**
   * Specifies the text to display for an item.
   *
   * Can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  value: (item: T) => MaybeSignal<Translatable | undefined>;
  sortable?: boolean | {comparator: SciTableColumnSortComparatorFn<T, string>};
  filterable?: boolean | {matcher: SciTableColumnFilterMatcherFn<T, string>};
}

/**
 * Configures a table column for displaying numeric values.
 */
export interface SciNumberColumnDescriptor<T> extends SciTableColumnDescriptor {
  /**
   * Specifies the number to display for an item.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  value: (item: T) => MaybeSignal<number | undefined>;
  /**
   * Controls whether the user can sort this column. Defaults to `true`.
   */
  sortable?: boolean;
  /**
   * Controls whether the user can filter this column. Defaults to `true`.
   */
  filterable?: boolean;
  /**
   * Specifies how to format numbers. Defaults to standard number formatting based on the active {@link locale}.
   *
   * ##### Grouping Separators
   * Disable grouping separators (such as thousands separators) by setting {@link Intl.NumberFormatOptions.useGrouping} to `false`.
   *
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table(data, table => table.addNumberColumn({
   *   value: item => item.numericValue,
   *   format: {useGrouping: false},
   * }));
   * ```
   *
   * ##### Fraction Digits
   * Control the number of decimal places using the {@link Intl.NumberFormatOptions.minimumFractionDigits} and {@link Intl.NumberFormatOptions.maximumFractionDigits} properties.
   *
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table(data, table => table.addNumberColumn({
   *   value: item => item.numericValue,
   *   format: {
   *     minimumFractionDigits: 2,
   *     maximumFractionDigits: 2,
   *   },
   * }));
   * ```
   *
   * ##### Currency
   * To render numbers as currency, set {@link Intl.NumberFormatOptions.style} to `currency` and specify the currency code.
   *
   * The currency code defaults to {@link DEFAULT_CURRENCY_CODE}, or `USD` if not provided.
   * To change the currency, set the {@link Intl.NumberFormatOptions.currency} property to a different [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currency code (e.g., `EUR`, `CHF`, `GBP`).
   *
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table(data, table => table.addNumberColumn({
   *   value: item => item.numericValue,
   *   format: {
   *     style: 'currency',
   *     currency: 'EUR',
   *   },
   * }));
   * ```
   *
   * ##### Unit
   * To render numbers with a specific unit (e.g., `kilogram`, `kilometer`, `kilometer-per-hour`, or `hour`), set {@link Intl.NumberFormatOptions.style} to `unit`
   * and specify the unit from [Supported Unit Identifiers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf#supported_unit_identifiers).
   *
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table(data, table => table.addNumberColumn({
   *   value: item => item.numericValue,
   *   format: {
   *     style: 'unit',
   *     unit: 'kilometer-per-hour',
   *   },
   * }));
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf#supported_unit_identifiers
   * @see https://en.wikipedia.org/wiki/ISO_4217
   */
  format?: Intl.NumberFormatOptions;
  /**
   * Specifies the locale used to localize numbers.
   *
   * The locale determines group sizing and separators, decimal point characters, and other locale-specific formatting rules.
   *
   * Defaults to {@link SCI_LOCALE}, which initializes from {@link LOCALE_ID} (defaulting to `en-US`).
   *
   * See {@link SCI_LOCALE} for details on how to change the locale at runtime.
   */
  locale?: MaybeSignal<string>;
}

/**
 * Configures a table column for displaying boolean values.
 */
export interface SciBooleanColumnDescriptor<T> extends SciTableColumnDescriptor {
  /**
   * Specifies the boolean value to display for an item.
   *
   * Cells display `true` as a checkmark and `false` as an 'X'. Filter options are labeled as 'Yes'/'No'.
   * For custom display or filter options, use {@link addEnumColumn} instead.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  value: (item: T) => MaybeSignal<boolean | undefined>;
  /**
   * Controls whether the user can sort this column. Defaults to `true`.
   */
  sortable?: boolean;
  /**
   * Controls whether the user can filter this column. Defaults to `true`.
   */
  filterable?: boolean;
}

/**
 * Configures a table column for displaying dates.
 */
export interface SciDateColumnDescriptor<T> extends SciTableColumnDescriptor {
  /**
   * Specifies the date value to display for an item.
   *
   * Can be an ISO 8601 date/time string (e.g., `2026-10-06`, `2026-10-06T14:30:15Z`, `T14:30:15`), milliseconds since the UTC epoch, or a `Date` object.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  value: (item: T) => MaybeSignal<SciDateLike | undefined>;
  /**
   * Controls whether the user can sort this column. Defaults to `true`.
   */
  sortable?: boolean;
  /**
   * Controls whether the user can filter this column. Defaults to `true`.
   */
  filterable?: boolean;
  /**
   * Specifies how to format dates. Defaults to the format configured in {@link DATE_PIPE_DEFAULT_OPTIONS}, or `mediumDate` if not provided.
   *
   * Accepts a predefined Angular date format (e.g., `mediumDate`, `mediumTime`) or a custom format (e.g., `dd.MM.yyyy`, `HH:mm`).
   * Formatting may vary depending on the active {@link locale}.
   *
   * Use a time-only format to display only the time component.
   *
   * @see https://angular.dev/api/common/DatePipe#pre-defined-format-options
   * @see https://angular.dev/api/common/DatePipe#custom-format-options
   */
  format?: 'shortDate' | 'mediumDate' | 'longDate' | 'fullDate' | 'shortTime' | 'mediumTime' | 'longTime' | 'fullTime' | 'short' | 'medium' | 'long' | 'full' | string;
  /**
   * Specifies the locale used to localize dates.
   *
   * The locale determines date/time patterns, month and weekday names, AM/PM indicators, and related formatting symbols.
   *
   * Defaults to {@link SCI_LOCALE}, which initializes from {@link LOCALE_ID} (defaulting to `en-US`).
   *
   * See {@link SCI_LOCALE} for details on how to change the locale at runtime.
   */
  locale?: MaybeSignal<string>;
  /**
   * Specifies the timezone in which to render dates.
   *
   * Must be a UTC/GMT offset (e.g., `+0430` or `-0500`).
   *
   * Defaults to the timezone configured in {@link DATE_PIPE_DEFAULT_OPTIONS}, or the user's system timezone if not provided.
   */
  timezone?: string;
}

/**
 * Configures a table column for displaying values of an enumeration.
 */
export interface SciEnumColumnDescriptor<T = unknown> extends SciTableColumnDescriptor {
  /**
   * Specifies the enumeration value to display for an item. Must be a value of an entry defined in {@link values}.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  value: (item: T) => MaybeSignal<SciEnumValueLike | undefined>;
  /**
   * Specifies the enumeration entries.
   *
   * Entries are displayed in array order in the column filter.
   */
  values: MaybeSignal<SciEnumColumnValues>;
  /**
   * Configures the display of enumeration values.
   */
  format?: {
    /**
     * Controls whether to display the icon.
     */
    icon?: true;
    /**
     * Controls whether to display the label.
     */
    label?: true;
    /**
     * Configures the display of entries in the column filter.
     */
    filter?: {
      /**
       * Controls whether to display the icon.
       */
      icon?: true;
    };
  };
  /**
   * Controls whether the user can sort this column. Defaults to `true`.
   */
  sortable?: boolean;
  /**
   * Controls whether the user can filter this column. Defaults to `multi`.
   */
  filterable?: 'single' | 'multi' | false;
  /**
   * Specifies the column data type to add to the HTML `part` attribute of column cells. Defaults to `enum`.
   *
   * @internal
   */
  referenceType?: SciTableColumnType;
}

/**
 * Configures a table column for displaying icons.
 */
export interface SciIconColumnDescriptor<T = unknown> extends SciTableColumnDescriptor {
  /**
   * Specifies the icon to display for an item.
   *
   * SCION uses icon providers to render icons. An icon provider can be registered using {@link provideIconProvider}.
   *
   * Defaults to a Material icon provider if the application has not registered an icon provider, interpreting the icon as a Material Icon font ligature.
   * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  value: (item: T) => MaybeSignal<string | number | undefined>;
  /**
   * Controls whether the user can sort this column. Defaults to `true`.
   */
  sortable?: boolean;
  /**
   * Controls whether the user can filter this column. Defaults to `multi`.
   */
  filterable?: 'single' | 'multi' | false;
  /**
   * Specifies the icons displayed in this column.
   *
   * Icons are displayed in array order in the column filter.
   */
  values: MaybeSignal<SciIconColumnValues>;
}

export interface SciComponentColumnDescriptor<T> extends SciTableColumnDescriptor {
  component: (item: T) => SciComponentDescriptor;
  sortable?: boolean | {comparator: SciTableColumnSortComparatorFn<T, void>};
  filterable?: boolean | {matcher: SciTableColumnFilterMatcherFn<T, void, string>};
  /**
   * Controls whether cell padding is applied. Set to `false` to let content fill the entire cell (render to cell bounds).
   *
   * Defaults to `true`.
   */
  padding?: boolean;
}

export interface SciTemplateColumnDescriptor<T> extends SciTableColumnDescriptor {
  template: (item: T) => SciTemplateDescriptor;
  sortable?: boolean | {comparator: SciTableColumnSortComparatorFn<T, void>};
  filterable?: boolean | {matcher: SciTableColumnFilterMatcherFn<T, void, string>};
  /**
   * Controls whether cell padding is applied. Set to `false` to let content fill the entire cell (render to cell bounds).
   *
   * Defaults to `true`.
   */
  padding?: boolean;
}

/**
 * Represents a column descriptor.
 */
export type SciTableColumnDescriptorLike<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciEnumColumnDescriptor<T> | SciDateColumnDescriptor<T> | SciIconColumnDescriptor<T> | SciComponentColumnDescriptor<T> | SciTemplateColumnDescriptor<T>;

/**
 * Signature of a function used to configure a comparator for sorting a table column.
 */
export type SciTableColumnSortComparatorFn<T = unknown, VALUE = unknown> = (a: SciTableCellContext<T, VALUE>, b: SciTableCellContext<T, VALUE>) => number;

/**
 * Signature of a function used to configure a matcher for filtering a table column.
 */
export type SciTableColumnFilterMatcherFn<T = unknown, VALUE = unknown, FILTER = VALUE> = (filter: FILTER, context: SciTableCellContext<T, VALUE>) => boolean;
