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
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {ColumnSplittersComponent} from './column-splitters/column-splitters.component';
import {SciColumnLike} from './table.model';

export class TablePO {

  constructor(private _fixture: ComponentFixture<unknown>) {
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement;
  }

  public get viewport(): HTMLElement {
    return this.debugElement.query(By.css('.e2e-viewport')).nativeElement as HTMLElement;
  }

  public get rows(): Array<RowPO> {
    return this.debugElement.queryAll(By.css(`sci-table-row`)).map(element => new RowPO(element, this._fixture));
  }

  public get columns(): Array<ColumnPO> {
    return this.debugElement.queryAll(By.css(`sci-column-header`)).map(element => new ColumnPO(element, this._fixture));
  }

  public get splitters(): ColumnSplittersComponent<unknown> {
    return this.debugElement.query(By.directive(ColumnSplittersComponent)).componentInstance as ColumnSplittersComponent<unknown>;
  }

  public get scrollTop(): number {
    return this.viewport.scrollTop;
  }

  public async autoResize<T>(column: SciColumnLike<T>): Promise<void> {
    await this.splitters.onResizeAuto(column as SciColumnLike);
    await this._fixture.whenStable();
  }

  public getColumnByHeader(columnName: string): ColumnPO | undefined {
    return this.columns.find(column => column.header === columnName);
  }

  public columnEntries(columnName: string): Array<string> {
    const index = this.getColumnIndexByName(columnName);
    return this.rows.map(row => row.cells[index]!.value);
  }

  public clickRowAction(cssClass: string): void {
    (this.debugElement.query(By.css(`button.${cssClass}`)).nativeElement as HTMLElement).click();
  }

  public async scrollY(offset: number): Promise<void> {
    this.viewport.scrollTo(this.viewport.scrollLeft, this.viewport.scrollTop + offset);
    this.viewport.dispatchEvent(new Event('scroll'));
    await this._fixture.whenStable();
  }

  private getColumnIndexByName(columnName: string): number {
    return this.columns.findIndex(column => column.header === columnName);
  }
}

export class ColumnPO {

  constructor(private _debugElement: DebugElement, private _fixture: ComponentFixture<unknown>) {
  }

  public get debugElement(): DebugElement {
    return this._debugElement;
  }

  public get nativeElement(): HTMLButtonElement {
    return this.debugElement.nativeElement as HTMLButtonElement;
  }

  public get header(): string | undefined {
    return this.nativeElement.querySelector('.text')?.textContent.trim();
  }

  public get width(): number {
    return this.nativeElement.getBoundingClientRect().width;
  }

  public async toggleSort(): Promise<void> {
    const sortButton: HTMLElement = this.nativeElement.querySelector('.e2e-column-sort')!;
    sortButton.click();
    await this._fixture.whenStable();
  }

  public async filter(text: string): Promise<void> {
    const filterInput: HTMLInputElement | null = this.nativeElement.querySelector('sci-column-filter input');
    const filterSelect: HTMLSelectElement | null = this.nativeElement.querySelector('sci-column-filter select');

    if (filterInput) {
      filterInput.value = text;
      filterInput.dispatchEvent(new Event('input'));
    }
    else if (filterSelect) {
      filterSelect.value = text;
      filterSelect.dispatchEvent(new Event('change'));
    }

    // wait for debounce
    await new Promise(resolve => setTimeout(resolve, 210));

    await this._fixture.whenStable();
  }
}

export class RowPO {

  constructor(private _debugElement: DebugElement, private fixture: ComponentFixture<unknown>) {
  }

  public get debugElement(): DebugElement {
    return this._debugElement;
  }

  public get nativeElement(): HTMLButtonElement {
    return this.debugElement.nativeElement as HTMLButtonElement;
  }

  public get cells(): Array<CellPO> {
    return this.debugElement.queryAll(By.css('sci-table-cell')).map(element => new CellPO(element));
  }

  public hover(): void {
    this.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
  }

  public dblClick(): void {
    this.nativeElement.dispatchEvent(new MouseEvent('dblclick'));
  }

  public enter(): void {
    this.nativeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'enter'}));
  }

  public select(): void {
    this.nativeElement.click();
  }
}

export class CellPO {

  constructor(private _debugElement: DebugElement) {
  }

  public get debugElement(): DebugElement {
    return this._debugElement;
  }

  public get nativeElement(): HTMLButtonElement {
    return this.debugElement.nativeElement as HTMLButtonElement;
  }

  public get value(): string {
    return this.nativeElement.textContent.trim();
  }
}

export function getByText<T extends Element = HTMLElement>(element: HTMLElement, selector: string, text: string): T | undefined {
  return Array.from(element.querySelectorAll(selector))
    .find(el => el.textContent.trim() === text) as T;
}
