/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, input, inputBinding, Signal, signal} from '@angular/core';
import {SciDataSource, SciTableComponent, SciTableFactory, SciTableRequest, SciTableResponse, table} from '@scion/components/table';
import {companies, Company} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {Field, form} from '@angular/forms/signals';
import {map, Observable, timer} from 'rxjs';
import {SciTable} from '../../../../../projects/scion/components/table/src/table.model';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-date-cell',
  imports: [
    DatePipe,
  ],
  template: `
    {{ date() | date : 'dd.MM.yyyy' }}
  `,
})
class DateCellComponent {
  protected readonly date = input.required<Date>();
}

class SlowDataSource implements SciDataSource<Company, number> {
  public pageSize = 50;

  public getItems(request: SciTableRequest): Observable<SciTableResponse<Company>> {
    return timer(1000).pipe(
      map(() => ({
        items: companies.slice(request.start, request.end),
        totalCount: companies.length,
      })),
    );
  }

  public identity(item: Company): number {
    return item.code;
  }
}

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  imports: [
    SciTableComponent,
    FormsModule,
    Field,
  ],
})
export default class SciTablePageComponent {
  protected data = signal(companies);
  protected activeItem = signal<number | undefined>(undefined);
  protected selectedItems = signal<string | undefined>(undefined);
  protected additionalData = signal(0);

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    language: 'de',
    slowDataSource: false,
  });
  protected form = form(this.settings);

  protected table: Signal<SciTable<Company, unknown>> = table(this.data, table => this.createTable(table));
  protected slowTable: Signal<SciTable<Company, unknown>> = table(new SlowDataSource(), table => this.createTable(table));

  protected createTable(table: SciTableFactory<Company>): SciTableFactory<Company> {
    const settings = this.settings();

    if (!settings.showHeader) {
      table.hideHeader();
    }

    if (!settings.filterable) {
      table.disableFilter();
    }

    if (!settings.sortable) {
      table.disableSort();
    }

    if (!settings.resizable) {
      table.disableResize();
    }

    return table
      .addNumberColumn('Code', company => company.code)
      .addStringColumn({
        header: 'Abkürzung',
        value: company => company.abbreviation,
        width: '1fr',
      })
      .addStringColumn({
        header: 'Name',
        value: company => company.name,
        width: '1fr',
      })
      .addBooleanColumn('EVU', company => company.railwayUndertaking)
      .addComponentColumn({
        header: 'Gültig ab',
        sort: (a, b) => new Date(a.item.validFrom).getTime() - new Date(b.item.validFrom).getTime(),
        component: item => ({
          component: DateCellComponent,
          bindings: [inputBinding('date', () => new Date(item.validFrom))],
        }),
      })
      .addComponentColumn({
        header: 'Gültig bis',
        sort: (a, b) => new Date(a.item.validTo).getTime() - new Date(b.item.validTo).getTime(),
        component: item => ({
          component: DateCellComponent,
          bindings: [inputBinding('date', () => new Date(item.validTo))],
        }),
      })
      .name('companies');
  }

  protected onActivateRow(row: unknown): void {
    this.activeItem.set(typeof row === 'number' ? row : (row as Company | undefined)?.code);
  }

  protected onSelectRows(selection: Set<unknown>): void {
    const selectionValues = [...selection.values()];
    this.selectedItems.set(selectionValues.length ? selectionValues.map(s => typeof s === 'number' ? s : (s as Company).code).join(', ') : undefined);
  }

  protected onUpdateSignal(): void {
    this.additionalData.update(d => d + 1);
  }
}
