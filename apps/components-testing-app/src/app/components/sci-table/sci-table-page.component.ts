/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, input, inputBinding, signal, TemplateRef, viewChild} from '@angular/core';
import {SciTableComponent, SciTableFactory, SciCellContext, table} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {Field, form, required} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

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
  return context.item.id === 1;
}

function customSort(a: SciCellContext<Product, unknown>, b: SciCellContext<Product, unknown>): number {
  return a.item.id - b.item.id;
}

const createDefaultColumn = () => ({
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

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    slowDataSource: false,
  });
  protected settingsForm = form(this.settings);

  protected column = signal(createDefaultColumn());
  protected columnForm = form(this.column, column => {
    required(column.name);
    required(column.type);
    required(column.header);
  });

  protected data = signal(generateData(30));
  protected columns = signal<ReturnType<typeof this.column>[]>([]);

  protected table = table(this.data, table => this.createTable(table));

  private cellTemplate = viewChild.required<TemplateRef<unknown>>('cell');

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

    table.addNumberColumn({
      header: 'Id',
      value: product => product.id,
    });

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
        case '':
          break;
        default:
          table.addStringColumn(column.name, product => product.name);
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
