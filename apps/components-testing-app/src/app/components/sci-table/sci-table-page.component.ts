/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, inject, Injector, input, inputBinding, Signal, signal, TemplateRef, untracked, viewChild} from '@angular/core';
import {SciCellContext, SciTable, SciTableComponent, SciTableFactory, SciTableRequest, SciTableResponse, table} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {form, FormField, required} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {map, Observable, timer} from 'rxjs';

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

function generateData(length: number = 10_000): Product[] {
  return Array.from({length}, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 1000) + 1,
    inStock: Math.random() > 0.5,
  }));
}

function customFilter(text: unknown, context: SciCellContext<Product, unknown>): boolean {
  return context.item.name.includes(text as string);
}

function customSort(a: SciCellContext<Product, unknown>, b: SciCellContext<Product, unknown>): number {
  return a.item.id - b.item.id;
}

function slowDataLoader(data: Signal<Product[]>) {
  return (request: SciTableRequest): Observable<SciTableResponse<Product>> => {
    return timer(1000).pipe(
      map(() => ({
        items: request.columnFilters.length > 0 ? [] : data().slice(request.start, request.end),
        totalCount: request.columnFilters.length > 0 ? 0 : data().length,
      })),
    );
  };
}

const createDefaultColumn = (): {name: string; type: string; header: string; resizable: boolean; width: string; minWidth: string; maxWidth: string; customSort: boolean; customFilter: boolean;} => ({
  name: '',
  type: '',
  header: '',
  resizable: true,
  width: '',
  minWidth: '',
  maxWidth: '',
  customSort: false,
  customFilter: false,
});

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  host: {
    '[style.--table-page-height]': '`${settings().height}px`',
    '[style.--table-page-width]': '`${settings().width}px`',
    '[style.--sci-table-row-height]': '`${settings().rowSize}px`',
  },
  imports: [
    SciTableComponent,
    FormsModule,
    FormField,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciTablePageComponent {

  public type = input<'slow' | undefined>();

  private _injector = inject(Injector);

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    showRowAction: false,
    slowDataSource: false,
    conditionallyStyleRow: false,
    rowCount: 10000,
    rowSize: 28,
    height: 600,
    width: 600,
    tableCount: 1,
  });
  protected tableCount = computed(() => this.settings().tableCount);
  protected rowCount = computed(() => this.settings().rowCount);
  protected settingsForm = form(this.settings);

  protected column = signal(createDefaultColumn());
  protected columnForm = form(this.column, column => {
    required(column.type);
    required(column.header);
  });

  protected data = computed(() => generateData(this.rowCount()));
  protected columns = signal<ReturnType<typeof this.column>[]>([]);
  protected tables = signal<SciTable<Product>[]>([]);

  private cellTemplate = viewChild.required<TemplateRef<unknown>>('cell');

  constructor() {
    effect(() => {
      const count = this.tableCount();
      const tables = [];

      const showRowActions = computed(() => this.settings().showRowAction)();
      const conditionallyStyleRow = computed(() => this.settings().conditionallyStyleRow)();
      const type = this.type();

      for (let i = 0; i < count; i++) {
        tables.push(untracked(() => table<Product>({
          name: `table:${i}`,
          headerVisible: computed(() => this.settings().showHeader),
          sortable: computed(() => this.settings().sortable),
          filterable: computed(() => this.settings().filterable),
          resizable: computed(() => this.settings().resizable),
          data: type === 'slow' ? slowDataLoader(this.data) : this.data,
          rowState: conditionallyStyleRow ?
            (row: Product) => row.id % 3 === 0 ? 'row:red' : [] :
            undefined,
          rowActions: showRowActions ? (item, toolbar) => {
            toolbar.addToolbarButton({
              icon: 'scion.delete',
              onSelect: () => console.log('delete', item.id),
            });
          } : undefined,
        }, table => this.createTable(table), {injector: this._injector})));
      }

      this.tables.set(tables);
    });
  }

  protected createTable(table: SciTableFactory<Product>): SciTableFactory<Product> {
    table.addNumberColumn({
      header: 'Id',
      value: product => product.id,
      name: 'column:id',
    });

    for (const column of this.columns()) {
      const baseColumn = {
        header: column.header,
        name: `column:${column.name}` as const,
        width: column.width ? column.width : undefined,
        minWidth: column.minWidth ? +column.minWidth : undefined,
        maxWidth: column.maxWidth ? +column.maxWidth : undefined,
        resizable: column.resizable,
      };

      switch (column.type) {
        case 'string':
          table.addStringColumn({
            ...baseColumn,
            filterable: column.customFilter ? {matcher: customFilter} : undefined,
            sortable: column.customSort ? {comparator: customSort} : undefined,
            value: product => product.name,
          });
          break;
        case 'number':
          table.addNumberColumn({
            ...baseColumn,
            value: product => product.price,
          });
          break;
        case 'boolean':
          table.addBooleanColumn({
            ...baseColumn,
            value: product => product.inStock,
          });
          break;
        case 'component':
          table.addComponentColumn({
            ...baseColumn,
            filterable: column.customFilter ? {matcher: customFilter} : undefined,
            sortable: column.customSort ? {comparator: customSort} : undefined,
            component: product => ({component: CustomCell, bindings: [inputBinding('product', () => product)]}),
          });
          break;
        case 'template':
          table.addTemplateColumn({
            ...baseColumn,
            filterable: column.customFilter ? {matcher: customFilter} : undefined,
            sortable: column.customSort ? {comparator: customSort} : undefined,
            template: item => ({template: this.cellTemplate, context: {$implicit: item}}),
          });
          break;
      }
    }

    return table;
  }

  protected onColumnSubmit(): void {
    if (this.columnForm().invalid()) {
      return;
    }

    this.columns.update(columns => [
      ...columns,
      this.column(),
    ]);

    this.column.set(createDefaultColumn());
    this.columnForm().reset();
  }
}

@Component({
  selector: 'app-custom-cell',
  template: `
    <span class="material-symbols-outlined">
      @if (product().inStock) {
        add
      } @else {
        close
      }
    </span>
  `,
})
class CustomCell {
  protected readonly product = input.required<Product>();
}
