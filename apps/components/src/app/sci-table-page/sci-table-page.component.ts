/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, inject, Injector, input, inputBinding, runInInjectionContext, signal, untracked} from '@angular/core';
import {SciDataLoaderFn, SciTableComponent, SciTableDescriptor, SciTableFactory, SciTableRequest, SciTableResponse, table} from '@scion/components/table';
import {companies, Company, filter, sort} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {form, FormField} from '@angular/forms/signals';
import {combineLatestWith, map, Observable, scan, Subject, timer} from 'rxjs';
import {DatePipe} from '@angular/common';
import {toObservable} from '@angular/core/rxjs-interop';
import {UUID} from '@scion/toolkit/uuid';
import {startWith} from 'rxjs/operators';
import {text} from '@scion/components/text';
import {createDestroyableInjector} from '@scion/components/common';

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

const data = signal(new Array(100_000).fill(0).map((_, i) => ({
  ...companies[i % companies.length]!,
  dataId: UUID.randomUUID(),
})));

const updates$ = new Subject<Company>();
const create$ = new Subject<{index: number; company: Company}>();

function slowDataSource(): SciDataLoaderFn<Company> {
  const _data$ = toObservable(data).pipe(
    combineLatestWith(create$.pipe(startWith(null))),
    scan((companies, [data, create]) => {
      const newCompanies = companies.length === 0 ? data : companies;
      if (create == null) {
        return newCompanies;
      }
      newCompanies.splice(create.index, 0, create.company);
      return newCompanies;
    }, [] as Company[]),
  );

  return (request: SciTableRequest): Observable<SciTableResponse<Company>> => {
    return timer(1000).pipe(
      combineLatestWith(_data$, updates$.pipe(startWith(null))),
      scan((companies, [_, data, update]) => {
        const newCompanies = companies.length === 0 ? data : companies;
        if (update === null) {
          return newCompanies;
        }
        const index = newCompanies.findIndex(company => company.dataId == update.dataId);
        newCompanies.splice(index, 1, update);
        return newCompanies;
      }, [] as Company[]),
      map(companies => {
        const filtered = sort(filter(companies, request.columnFilters, request.globalFilter), request.sortCriteria);
        return ({
          items: filtered.slice(request.start, request.end),
          totalCount: filtered.length,
        });
      }),
    );
  };
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
  protected injector = inject(Injector);

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    slowDataSource: true,
    selectable: 'multi',
  });
  protected form = form(this.settings);

  protected update = signal({
    companyJSON: '',
  });
  protected updateForm = form(this.update);

  private _useSlowDataSource = computed(() => this.settings().slowDataSource);
  private _slowDataSource = slowDataSource();

  protected tableConfig: Omit<SciTableDescriptor<Company>, 'data'> = {
    name: 'table:companies',
    headerVisible: computed(() => this.settings().showHeader),
    sortable: computed(() => this.settings().sortable),
    filterable: computed(() => this.settings().filterable),
    resizable: computed(() => this.settings().resizable),
    selectable: computed(() => this.settings().selectable === 'disabled' ? false : this.settings().selectable as 'single' | 'multi'),
    trackBy: company => company.dataId,
    rowActions: (company, toolbar) => {
      toolbar.addToolbarButton({
        icon: 'scion.delete',
        onSelect: () => {
          data.update(companies => companies.filter(c => c.dataId !== company.dataId));
        },
      });
      toolbar.addToolbarButton({
        icon: 'content_copy',
        onSelect: () => {
          const index = data().findIndex(c => c.dataId === company.dataId);
          if (index >= 0) {
            create$.next({index, company: {...company, dataId: UUID.randomUUID()}});
          }
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

  protected table = signal(table<Company>({...this.tableConfig, data}, table => this.createTable(false, table)));
  protected activeItem = computed(() => this.table().activeItem());
  protected selectedItems = computed(() => this.table().selectedItems());

  constructor() {
    effect(onCleanup => {
      const slowDataSource = this._useSlowDataSource();
      const dataSource = slowDataSource ? this._slowDataSource : data;
      untracked(() => {
        const injector = createDestroyableInjector({parent: this.injector});
        onCleanup(() => injector.destroy());
        this.table.set(runInInjectionContext(injector,
          () => table<Company>({...this.tableConfig, data: dataSource}, table => this.createTable(slowDataSource, table)),
        ));
      });
    });
  }

  protected createTable(slowDataSource: boolean, table: SciTableFactory<Company>): SciTableFactory<Company> {
    return table
      .addStringColumn({
        header: 'ID',
        value: company => company.dataId,
        name: 'column:id',
        filterable: false,
      })
      .addNumberColumn({
        header: 'Code',
        value: company => company.code,
        name: 'column:code',
      })
      .addStringColumn({
        header: '%scion.components.clear.tooltip',
        value: company => text(`%${company.abbreviation}`, {injector: this.injector}),
        width: '1fr',
        name: 'column:abbreviation',
      })
      .addStringColumn({
        header: 'Name',
        value: company => company.name,
        width: '1fr',
        name: 'column:name',
      })
      .addBooleanColumn({
        header: 'EVU',
        value: company => company.railwayUndertaking,
        name: 'column:railwayUndertaking',
      })
      .addComponentColumn({
        header: 'Gültig ab',
        name: 'column:validFrom',
        sortable: slowDataSource ? true : {comparator: (a, b) => new Date(a.item.validFrom).getTime() - new Date(b.item.validFrom).getTime()},
        filterable: slowDataSource ? true : {matcher: (query, item) => item.item.validFrom.includes(query)},
        component: item => ({
          component: DateCellComponent,
          bindings: [inputBinding('date', () => new Date(item.validFrom))],
        }),
      })
      .addComponentColumn({
        header: 'Gültig bis',
        name: 'column:validTo',
        filterable: slowDataSource ? true : {matcher: (query, item) => item.item.validTo.includes(query)},
        sortable: slowDataSource ? true : {comparator: (a, b) => new Date(a.item.validTo).getTime() - new Date(b.item.validTo).getTime()},
        component: item => ({
          component: DateCellComponent,
          bindings: [inputBinding('date', () => new Date(item.validTo))],
        }),
      });
  }

  protected onUpdate(): void {
    const company = JSON.parse(this.update().companyJSON) as Company;
    updates$.next(company);
  }
}
