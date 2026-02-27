/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, inject, Injector, input, inputBinding, runInInjectionContext, signal, untracked} from '@angular/core';
import {SciDataSourceDescriptor, SciTableComponent, SciTableDescriptor, SciTableFactory, SciTableRequest, SciTableResponse, SelectionType, table} from '@scion/components/table';
import {companies, Company} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {form, FormField} from '@angular/forms/signals';
import {combineLatestWith, map, Observable, timer} from 'rxjs';
import {DatePipe} from '@angular/common';
import {toObservable} from '@angular/core/rxjs-interop';

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

class SlowDataSource implements SciDataSourceDescriptor<Company> {
  public data = signal(companies);
  private _data$ = toObservable(this.data);

  public loader(request: SciTableRequest): Observable<SciTableResponse<Company>> {
    return timer(1000).pipe(
      combineLatestWith(this._data$),
      map(([_, companies]) => ({
        items: companies.slice(request.start, request.end),
        totalCount: companies.length,
      })),
    );
  }
}

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  imports: [
    SciTableComponent,
    FormsModule,
    FormField,
  ],
})
export default class SciTablePageComponent {
  protected data = signal(companies);

  protected injector = inject(Injector);

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    slowDataSource: false,
    selectionType: 'multi',
  });
  protected form = form(this.settings);
  private _useSlowDataSource = computed(() => this.settings().slowDataSource);
  private _slowDataSource = new SlowDataSource();

  protected tableConfig: Omit<SciTableDescriptor<Company, number>, 'data'> = {
    name: 'companies',
    showHeader: computed(() => this.settings().showHeader),
    sortable: computed(() => this.settings().sortable),
    filterable: computed(() => this.settings().filterable),
    resizable: computed(() => this.settings().resizable),
    selectionType: computed(() => this.settings().selectionType as SelectionType),
    identity: company => company.code,
    rowActions: (company, toolbar) => {
      toolbar.addToolbarButton({
        icon: 'scion.delete',
        onSelect: () => {
          this._slowDataSource.data.update(companies => companies.filter(c => c.dataId !== company.dataId));
        },
      });
      toolbar.addToolbarMenu({
        icon: 'scion.more_vertical',
        visualMenuIndicator: false,
      }, menu => {
        menu.addGroup(group => group.addMenuItem({
          label: 'Edit',
          onSelect: () => {console.log('edit', company);},
        }).addMenuItem({
          label: 'Duplicate',
          onSelect: () => {console.log('duplicate', company);},
        }).addMenuItem({
          label: 'Delete',
          onSelect: () => {console.log('delete', company);},
        })).addGroup(group => {
          group.addMenuItem({
            label: 'Copy to...',
            onSelect: () => {console.log('copy', company);},
          }).addMenuItem({
            label: 'Move to...',
            onSelect: () => {console.log('move', company);},
          });
        }).addMenuItem({
          label: 'Info...',
          onSelect: () => {console.log('info', company);},
        });
      });
    },
  };

  protected table = computed(() => {
    const data = this._useSlowDataSource() ? this._slowDataSource : this.data;
    return untracked(() => runInInjectionContext(this.injector,
      () => table<Company, number>({...this.tableConfig, data}, table => this.createTable(table)),
    ));
  });

  protected activeItem = computed(() => this.table().focusedItem());
  protected selectedItems = computed(() => [...this.table().selectedItems()].join(', '));

  protected createTable(table: SciTableFactory<Company>): SciTableFactory<Company> {
    return table
      .addNumberColumn('Code', company => company.code)
      .addStringColumn({
        header: 'Abkürzung',
        value: company => company.abbreviation,
        width: '1fr',
        maxWidth: 400,
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
        filter: (query, item) => item.item.validFrom.toString().includes(query),
        component: item => ({
          component: DateCellComponent,
          bindings: [inputBinding('date', () => new Date(item.validFrom))],
        }),
      })
      .addComponentColumn({
        header: 'Gültig bis',
        filter: (query, item) => item.item.validFrom.toString().includes(query),
        sort: (a, b) => new Date(a.item.validTo).getTime() - new Date(b.item.validTo).getTime(),
        component: item => ({
          component: DateCellComponent,
          bindings: [inputBinding('date', () => new Date(item.validTo))],
        }),
      });
  }
}
