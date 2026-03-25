/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, input, inputBinding, Signal, signal, TemplateRef, viewChild} from '@angular/core';
import {SciTableComponent, SciTableFactory, SciCellContext, table, SciDataSource, SciTableRequest, SciTableResponse} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {Field, form, required} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {map, Observable, timer} from 'rxjs';
import {SciTable} from '../../../../../../projects/scion/components/table/src/table.model';

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

class SlowDataSource implements SciDataSource<Product, number> {
  public pageSize = 50;

  constructor(private readonly _data: Signal<Product[]>) {}

  public getItems(request: SciTableRequest): Observable<SciTableResponse<Product>> {
    return timer(1000).pipe(
      map(() => ({
        items: this._data().slice(request.start, request.end),
        totalCount: this._data().length,
      })),
    );
  }

  public identity(item: Product): number {
    return item.id;
  }
}

const createDefaultColumn = (): {name: string; type: string; header: string; resizable: boolean; width: string; minWidth: string; maxWidth: string; customSort: boolean; customFilter: boolean; filterValues: string} => ({
  name: '',
  type: '',
  header: '',
  resizable: true,
  width: '',
  minWidth: '',
  maxWidth: '',
  customSort: false,
  customFilter: false,
  filterValues: '',
});

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  host: {
    '[style.--table-page-height]': '`${settings().height}px`',
  },
  imports: [
    SciTableComponent,
    FormsModule,
    Field,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciTablePageComponent {

  public type = input<'slow' | undefined>();

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    slowDataSource: false,
    rowCount: 10000,
    rowSize: 28,
    height: 600,
  });
  protected settingsForm = form(this.settings);

  protected column = signal(createDefaultColumn());
  protected columnForm = form(this.column, column => {
    required(column.type);
    required(column.header);
  });

  protected data = computed(() => generateData(this.settings().rowCount));
  protected columns = signal<ReturnType<typeof this.column>[]>([]);

  protected table?: Signal<SciTable<Product>>;

  private cellTemplate = viewChild.required<TemplateRef<unknown>>('cell');

  constructor() {
    effect(() => {
      if (this.type() === 'slow') {
        this.table = table(new SlowDataSource(this.data), table => this.createTable(table));
      }
      else {
        this.table = table(this.data, table => this.createTable(table));
      }
    });
  }

  protected createTable(table: SciTableFactory<Product>): SciTableFactory<Product> {
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

    table
      .itemSize(settings.rowSize)
      .addNumberColumn({
        header: 'Id',
        value: product => product.id,
      });

    // for (let i = 0; i < 5; i++) {
    //   table.addStringColumn({
    //     header: `Name${i}`,
    //     value: product => product.name,
    //   });
    // }

    for (const column of this.columns()) {
      const baseColumn = {
        header: column.header,
        name: column.name,
        width: column.width ? column.width : undefined,
        minWidth: column.minWidth ? column.minWidth : undefined,
        maxWidth: column.maxWidth ? column.maxWidth : undefined,
        resizable: column.resizable,
        filter: column.customFilter ? customFilter : undefined,
        sort: column.customSort ? customSort : undefined,
        filterValues: column.filterValues ? column.filterValues.split(',').map(v => v.trim()) : undefined,
      };

      switch (column.type) {
        case 'string':
          table.addStringColumn({
            ...baseColumn,
            value: product => product.name,
          });
          break;
        case 'number':
          table.addNumberColumn({
            ...baseColumn,
            value: product => product.price,
            filterValues: baseColumn.filterValues ? baseColumn.filterValues.map(v => +v) : undefined,
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
            component: product => ({component: CustomCell, bindings: [inputBinding('product', () => product)]}),
          });
          break;
        case 'template':
          table.addTemplateColumn({
            ...baseColumn,
            template: () => ({template: this.cellTemplate()}),
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
