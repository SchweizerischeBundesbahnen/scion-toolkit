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
import {RequireOne} from '@scion/toolkit/types';
import {waitUntilStable} from './testing/testing.util';

export class TablePO {

  public readonly element: ShadowRoot;

  constructor(fixture: ComponentFixture<unknown>) {
    const element = fixture.debugElement.nativeElement as Element;
    this.element = element.tagName === 'SCI-TABLE' ? element.shadowRoot! : element.querySelector('sci-table')!.shadowRoot!;
  }

  public get viewport(): HTMLElement {
    return this.element.querySelector('div.e2e-viewport')!;
  }

  public get rows(): RowPO[] {
    return [...this.element.querySelectorAll<HTMLElement>('sci-table-row')].map(element => new RowPO(element));
  }

  public get columns(): ColumnPO[] {
    return [...this.element.querySelectorAll('sci-column')]
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
      if (locateBy.header !== undefined && column.header !== locateBy.header) {
        return false;
      }
      return true;
    });
  }

  public get scrollTop(): number {
    return this.viewport.scrollTop;
  }

  public async scrollY(offset: number): Promise<void> {
    this.viewport.scrollTo({top: this.viewport.scrollTop + offset});
    this.viewport.dispatchEvent(new Event('scroll'));
    await this.waitUntilStable();
  }

  public async waitUntilStable(): Promise<void> {
    await waitUntilStable(() => this.rows.length);
  }
}

export class ColumnPO {

  private readonly _columnElement: HTMLElement;
  private readonly _headerElement: HTMLElement | null;

  constructor(public name: `column:${string}`, public index: number, private _table: TablePO) {
    this._columnElement = this._table.element.querySelector(`sci-column[data-column="${this.name}"]`)!;
    this._headerElement = this._table.element.querySelector(`sci-column-header[data-column="${this.name}"]`);
  }

  public get header(): string | undefined {
    return this._headerElement?.querySelector('.text')?.textContent.trim();
  }

  public get width(): number {
    return this._columnElement.getBoundingClientRect().width;
  }

  public get splitter(): HTMLElement {
    return this._table.element.querySelector(`sci-splitter[data-column="${this.name}"]`)!;
  }

  public async toggleSort(): Promise<void> {
    if (!this._headerElement) {
      throw Error('[PageObjectError] Table without header cannot be sorted.');
    }

    const sortButton: HTMLElement = this._headerElement.querySelector('.e2e-column-sort')!;
    sortButton.click();
    await this._table.waitUntilStable();
  }

  public async filter(text: string): Promise<void> {
    if (!this._headerElement) {
      throw Error('[PageObjectError] Table without header cannot be filtered.');
    }
    const filterInput: HTMLInputElement | null = this._headerElement.querySelector('sci-column-filter input');
    const filterSelect: HTMLSelectElement | null = this._headerElement.querySelector('sci-column-filter select');

    if (filterInput) {
      filterInput.value = text;
      filterInput.dispatchEvent(new Event('input'));
    }
    else if (filterSelect) {
      filterSelect.value = text;
      filterSelect.dispatchEvent(new Event('change'));
    }

    // Wait for debounce.
    await new Promise(resolve => setTimeout(resolve, 210));

    await this._table.waitUntilStable();
  }

  public async pack(): Promise<void> {
    this.splitter.dispatchEvent(new MouseEvent('dblclick'));
    await this._table.waitUntilStable();
  }

  public async values(): Promise<string[]> {
    await this._table.waitUntilStable();
    return this._table.rows.map(row => row.cells[this.index]!.value);
  }
}

export class RowPO {

  constructor(public element: HTMLElement) {
  }

  public get cells(): Array<CellPO> {
    return [...this.element.querySelectorAll<HTMLElement>('sci-table-cell')].map(element => new CellPO(element));
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

  public get rowIndex(): number {
    const rowIndex = this.element.getAttribute('data-row-index')!;
    if (rowIndex === null) {
      throw Error('[PageObjectError] Missing required `data-row-index` attribute on `<sci-table-row>`. Enable the `rowIndexAttribute` flag via the `ɵSCI_TABLE_FLAGS` DI token.')
    }
    return +rowIndex;
  }

  public rowAction(locateBy: {cssClass: string}): HTMLElement {
    return this.element.querySelector(`sci-toolbar button.${locateBy.cssClass}`)!;
  }
}

export class CellPO {

  constructor(public element: HTMLElement) {
  }

  public get value(): string {
    return this.element.textContent.trim();
  }
}

