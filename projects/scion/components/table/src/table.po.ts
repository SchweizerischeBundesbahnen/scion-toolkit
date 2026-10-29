/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ComponentFixture} from '@angular/core/testing';
import {OneOf, RequireOne} from '@scion/toolkit/types';
import {Arrays} from '@scion/toolkit/util';
import {waitUntilStable} from './testing/testing.util';
import {SciEnumValueLike, SciTableColumnType} from './table.model';

export class TablePO {

  public readonly element: ShadowRoot;
  public readonly body: HTMLElement;

  constructor(fixture: ComponentFixture<unknown>, tagName: string = 'sci-table') {
    const element = fixture.debugElement.nativeElement as Element;
    this.element = element.tagName === tagName.toLocaleUpperCase() ? element.shadowRoot! : element.querySelector(tagName)!.shadowRoot!;
    this.body = this.element.querySelector('sci-table-body')!;
  }

  public get header(): TableHeaderPO {
    return new TableHeaderPO(this.element.querySelector('sci-table-header')!);
  }

  public get viewport(): HTMLElement {
    return this.element.querySelector('sci-table-viewport')!;
  }

  public get rows(): RowPO[] {
    return [...this.element.querySelectorAll<HTMLElement>('sci-table-row')].map(element => new RowPO(element, this));
  }

  /**
   * Locates a row by its dataset index (`index`) or rendered DOM position (`nth`), both zero-based.
   */
  public row(locateBy: OneOf<{index: number; nth: number}>): RowPO {
    if (locateBy.index !== undefined) {
      return new RowPO(this.element.querySelector<HTMLElement>(`sci-table-row[data-row-index="${locateBy.index}"]`)!, this);
    }
    else {
      return new RowPO(this.element.querySelector<HTMLElement>(`sci-table-row:nth-of-type(${locateBy.nth + 1})`)!, this);
    }
  }

  public get columns(): ColumnPO[] {
    return [...this.element.querySelectorAll('sci-table-column')]
      .map(element => element.getAttribute('data-column') as `column:${string}`)
      .map((name, i) => new ColumnPO(name, i, this));
  }

  public column(locateBy: RequireOne<{name: `column:${string}`; header: string; index: number}>): ColumnPO | undefined {
    return this.columns.find(column => {
      if (locateBy.name !== undefined && column.name !== locateBy.name) {
        return false;
      }
      if (locateBy.index !== undefined && column.index !== locateBy.index) {
        return false;
      }
      if (locateBy.header !== undefined && column.header?.label !== locateBy.header) {
        return false;
      }
      return true;
    });
  }

  public get loadingIndicator(): HTMLElement | null {
    return this.element.querySelector('sci-throbber.e2e-loading-indicator');
  }

  public get scrollTop(): number {
    return this.viewport.scrollTop;
  }

  public async scrollY(scrollTo: OneOf<{y: number; deltaY: number}>): Promise<void> {
    this.viewport.scrollTo({top: scrollTo.y ?? this.viewport.scrollTop + scrollTo.deltaY});
    this.viewport.dispatchEvent(new Event('scroll'));
    await this.waitUntilStable();
  }

  public async waitUntilStable(): Promise<void> {
    await waitUntilStable(() => this.rows.length);
  }
}

export class ColumnPO {

  private readonly _columnElement: HTMLElement;
  private readonly _columnFilterElement: HTMLElement | null;

  public readonly header: ColumnHeaderPO | null;

  constructor(public name: `column:${string}`, public index: number, private _table: TablePO) {
    this._columnElement = this._table.element.querySelector(`sci-table-column[data-column="${this.name}"]`)!;
    const columnHeaderElement = this._table.element.querySelector<HTMLElement>(`sci-column-header[data-column="${this.name}"]`);
    this.header = columnHeaderElement && new ColumnHeaderPO(columnHeaderElement);
    this._columnFilterElement = this._table.element.querySelector(`sci-column-filter[data-column="${this.name}"]`);
  }

  public get type(): SciTableColumnType {
    return this._columnElement.getAttribute('data-type') as SciTableColumnType;
  }

  public get width(): number {
    return this._columnElement.getBoundingClientRect().width;
  }

  public get splitter(): HTMLElement {
    return this._table.element.querySelector(`sci-splitter[data-column="${this.name}"]`)!;
  }

  public async toggleSort(modifiers?: {ctrl?: true}): Promise<void> {
    if (!this.header?.sortButton) {
      throw Error('[PageObjectError] Table without header cannot be sorted.');
    }

    this.header.sortButton.dispatchEvent(new MouseEvent('click', {ctrlKey: modifiers?.ctrl ?? false}));
    await this._table.waitUntilStable();
  }

  public async filter(value: string | number | boolean | SciEnumValueLike[] | null): Promise<void> {
    if (!this._columnFilterElement) {
      throw Error('[PageObjectError] Table without column filters cannot be filtered.');
    }

    if (value === null) {
      this._columnFilterElement.querySelector<HTMLButtonElement>('button.e2e-clear')!.click();
    }
    else if (this.type === 'enum') {
      this._columnFilterElement.querySelector<HTMLButtonElement>('input[type="button"]')!.click();
      const menu = (await waitUntilStable(() => this._table.element.querySelector<HTMLElement>('sci-menu')))!;
      Arrays.coerce(value).forEach(value => menu.querySelector<HTMLButtonElement>(`button[data-option="${value}"]`)!.click());
    }
    else {
      const filterInput = this._columnFilterElement.querySelector<HTMLInputElement>('input')!;
      filterInput.value = `${value}`;
      filterInput.dispatchEvent(new Event('input'));
    }

    // Wait for debounce.
    await new Promise(resolve => setTimeout(resolve, 250));
    await this._table.waitUntilStable();
  }

  public async pack(): Promise<void> {
    this.splitter.dispatchEvent(new MouseEvent('dblclick'));
    await this._table.waitUntilStable();
  }

  /**
   * Gets values displayed in this column.
   *
   * @param options.rows - Specifies whether to return values from DOM rows (`'dom'`) or all table rows (`'all'`). Defaults to `'dom'`.
   */
  public async values(options?: {rows?: 'dom' | 'all'}): Promise<string[]> {
    const table = this._table;

    // Scroll down page by page until the end and collect the rows.
    if (options?.rows === 'all') {
      await table.scrollY({y: 0});

      const rows = new Array<{rowIndex: number; value: string}>();
      rows.push(...table.rows.map(row => ({rowIndex: row.rowIndex, value: row.cells[this.index]!.value ?? ''})));

      while (table.scrollTop !== table.viewport.scrollHeight - table.viewport.clientHeight) {
        await table.scrollY({deltaY: table.viewport.clientHeight - table.header.height});
        rows.push(...table.rows.map(row => ({rowIndex: row.rowIndex, value: row.cells[this.index]!.value ?? ''})));
      }

      // Remove duplicate rows, caused by virtual scrolling which inserts rows both before and after the visible area.
      return Arrays.distinct(rows, entry => entry.rowIndex).map(entry => entry.value);
    }
    else {
      return table.rows.map(row => row.cells[this.index]!.value ?? '');
    }
  }

  public get sortable(): boolean {
    return this.header?.sortButton !== null && this.header?.sortButton !== undefined;
  }

  public get filterable(): boolean {
    return this._columnFilterElement !== null;
  }
}

export class RowPO {

  constructor(public element: HTMLElement, private _table: TablePO) {
  }

  public get cells(): CellPO[] {
    return this._table.columns.map(column => new CellPO(this.element.querySelector(`sci-table-cell[data-column="${column.name}"]`)!, this, column));
  }

  public hover(): void {
    this.element.dispatchEvent(new MouseEvent('mouseenter'));
  }

  public dblClick(): void {
    this.element.dispatchEvent(new MouseEvent('dblclick'));
  }

  public enter(): void {
    this.element.dispatchEvent(new KeyboardEvent('keydown', {key: 'enter'}));
  }

  public select(): void {
    this.element.click();
  }

  public toggle(): void {
    this.element.querySelector<HTMLButtonElement>('button.e2e-toggle-children')!.click();
  }

  public isSelected(): boolean {
    return this.element.hasAttribute('data-selected');
  }

  public isActive(): boolean {
    return this.element.hasAttribute('data-active');
  }

  public get rowIndex(): number {
    const rowIndex = this.element.getAttribute('data-row-index');
    if (rowIndex === null) {
      throw Error('[PageObjectError] Missing required \'data-row-index\' attribute on `<sci-table-row>. Add it via `provideTableRowBinding()` function.');
    }
    return +rowIndex;
  }

  public rowAction(locateBy: {cssClass: string}): HTMLElement {
    return this.element.querySelector(`sci-toolbar button.${locateBy.cssClass}`)!;
  }

  public icon(): string[] {
    const icons = Array.from(this.element.querySelectorAll(':scope > sci-icon:has(~ sci-table-cell)'));
    return icons.map(icon => icon.getAttribute('icon')!);
  }
}

export class CellPO {

  constructor(public element: HTMLElement, public row: RowPO, public column: ColumnPO) {
  }

  public get value(): string | undefined {
    // Strip non-breaking spaces (NBSP) and narrow non-breaking spaces (NNBSP)
    return this.element.textContent.replace(/[\u00a0\u202f]+/g, ' ').trim() || this.element.getAttribute('data-value') || ''; // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
  }

  public isLoading(): boolean {
    return this.row.element.querySelector(`div.e2e-skeleton[data-column="${this.column.name}"]`) !== null;
  }
}

export class TableHeaderPO {

  constructor(public element: HTMLElement) {
  }

  public get height(): number {
    return this.element.offsetHeight;
  }
}

export class ColumnHeaderPO {

  public sortButton: HTMLButtonElement | null;

  constructor(public element: HTMLElement) {
    this.sortButton = this.element.querySelector<HTMLButtonElement>('button.e2e-sort');
  }

  public get icon(): string | null {
    return this.element.querySelector('sci-icon.e2e-label')?.getAttribute('icon') ?? null;
  }

  public get label(): string {
    return this.element.textContent.trim();
  }

  public get tooltip(): string | null {
    return this.element.getAttribute('title');
  }
}
