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
import {SciCellContext, SciColumnDescriptor, SciTable, SciTableComponent, SciTableDescriptor, SciTableRequest, SciTableResponse, table} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, required} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {map, Observable, timer} from 'rxjs';
import {createDestroyableInjector} from '@scion/components/common';
import {SciIconComponent} from '@scion/components/icon';

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  host: {
    '[style.--table-page-height]': '`${settingsForm.height().value()}px`',
    '[style.--table-page-width]': '`${settingsForm.width().value()}px`',
    '[style.--sci-table-row-height]': '`${settingsForm.rowSize().value()}px`',
  },
  imports: [
    SciTableComponent,
    FormsModule,
    FormField,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
    FormRoot,
    SciIconComponent,
  ],
})
export default class SciTablePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _cellTemplate = viewChild.required<TemplateRef<Product>>('cell');
  private readonly _columns = signal<ColumnForm[]>([]);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly columnForm: FieldTree<ColumnForm> = this.createColumnForm();

  protected readonly tables = signal<SciTable<Product>[]>([]);
  protected readonly selectedItems = computed(() => this.tables()[0]?.selectedItems());

  constructor() {
    this.createTables();
  }

  private createTables(): void {
    effect(onCleanup => {
      const tableCount = this.settingsForm.tableCount().value();
      const showRowActions = this.settingsForm.showRowAction().value();
      const customRowStyling = this.settingsForm.customRowStyling().value();
      const slowDataSource = this.settingsForm.slowDataSource().value();
      const settingsForm = this.settingsForm;
      const data = computed(() => generateData(this.settingsForm.rowCount().value()));
      const columns = this._columns;
      const cellTemplate = this._cellTemplate;

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());

        this.tables.set(Array.from(Array(tableCount), (_, i) => createTable(`table:${i}`, {injector})));
      });

      function createTable(name: `table:${string}`, options: {injector: Injector}): SciTable<Product> {
        const tableDescriptor: SciTableDescriptor<Product> = {
          name,
          headerVisible: computed(() => settingsForm.showHeader().value()),
          sortable: computed(() => settingsForm.sortable().value()),
          filterable: computed(() => settingsForm.filterable().value()),
          resizable: computed(() => settingsForm.resizable().value()),
          selectable: computed<false | 'single' | 'multi'>(() => {
            const selectable = settingsForm.selectable().value();
            return selectable === 'false' ? false : selectable;
          }),
          data: slowDataSource ? slowDataLoader(data) : data,
          rowState: customRowStyling ? (product: Product) => product.id % 3 === 0 ? 'row:red' : [] : undefined,
          rowActions: showRowActions ? (product, toolbar) => toolbar.addToolbarMenu({icon: 'scion.more_vertical', visualMenuIndicator: false}, menu => menu
            .addMenuItem({
              label: 'Edit',
              onSelect: () => console.log('edit', product.id),
            }),
          ) : undefined,
        };

        return table(tableDescriptor, table => columns().forEach(columnForm => {
          const column: SciColumnDescriptor = {
            header: columnForm.header,
            name: `column:${columnForm.name}` as const,
            width: columnForm.width ? columnForm.width : undefined,
            minWidth: columnForm.minWidth ? +columnForm.minWidth : undefined,
            maxWidth: columnForm.maxWidth ? +columnForm.maxWidth : undefined,
            resizable: columnForm.resizable,
          };

          switch (columnForm.type) {
            case 'string':
              table.addStringColumn({
                ...column,
                filterable: columnForm.customFilter ? {matcher: customFilter} : undefined,
                sortable: columnForm.customSort ? {comparator: customComparator} : undefined,
                value: product => product.name,
              });
              break;
            case 'number':
              table.addNumberColumn({
                ...column,
                value: product => product.price,
              });
              break;
            case 'boolean':
              table.addBooleanColumn({
                ...column,
                value: product => product.inStock,
              });
              break;
            case 'component':
              table.addComponentColumn({
                ...column,
                filterable: columnForm.customFilter ? {matcher: customFilter} : undefined,
                sortable: columnForm.customSort ? {comparator: customComparator} : undefined,
                component: product => ({component: CustomCellComponent, bindings: [inputBinding('product', () => product)]}),
              });
              break;
            case 'template':
              table.addTemplateColumn({
                ...column,
                filterable: columnForm.customFilter ? {matcher: customFilter} : undefined,
                sortable: columnForm.customSort ? {comparator: customComparator} : undefined,
                template: () => ({template: cellTemplate}),
              });
              break;
          }
        }), {injector: options.injector});
      }
    });
  }

  private createColumnForm(): FieldTree<ColumnForm> {
    const defaults: ColumnForm = {
      name: 'column:name',
      type: '',
      header: '',
      resizable: true,
      width: '',
      minWidth: '',
      maxWidth: '',
      customSort: false,
      customFilter: false,
    };

    return form(signal<ColumnForm>(defaults), column => {
      required(column.type);
      required(column.header);
    }, {
      submission: {
        action: async form => {
          this._columns.update(columns => columns.concat(form().value()));
          this.columnForm().reset(defaults);
        },
      },
    });
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    const defaults: SettingsForm = {
      filterable: true,
      sortable: true,
      resizable: true,
      selectable: 'multi',
      showHeader: true,
      showRowAction: false,
      slowDataSource: false,
      customRowStyling: false,
      rowCount: 10000,
      rowSize: 28,
      height: 600,
      width: 600,
      tableCount: 1,
    };
    return form(signal(defaults));
  }
}

@Component({
  selector: 'app-custom-cell',
  template: `
    <sci-icon class="custom-cell up">{{product().inStock ? 'add' : 'close'}}</sci-icon>`,
  imports: [
    SciIconComponent,
  ],
})
class CustomCellComponent {
  protected readonly product = input.required<Product>();
}

interface ColumnForm {
  name: string;
  type: string;
  header: string;
  resizable: boolean;
  width: string;
  minWidth: string;
  maxWidth: string;
  customSort: boolean;
  customFilter: boolean
}

interface SettingsForm {
  filterable: boolean;
  sortable: boolean;
  resizable: boolean;
  selectable: 'false' | 'single' | 'multi',
  showHeader: boolean;
  showRowAction: boolean;
  slowDataSource: boolean;
  customRowStyling: boolean;
  rowCount: number;
  rowSize: number;
  height: number;
  width: number;
  tableCount: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

function generateData(length: number = 10_000): Product[] {
  return Array.from(Array(length), (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 1000) + 1,
    inStock: Math.random() > 0.5,
  }));
}

function customFilter(text: string, context: SciCellContext<Product, unknown>): boolean {
  return context.item.name.includes(text as string);
}

function customComparator(a: SciCellContext<Product, unknown>, b: SciCellContext<Product, unknown>): number {
  return a.item.id - b.item.id;
}

function slowDataLoader(data: Signal<Product[]>) {
  return (request: SciTableRequest): Observable<SciTableResponse<Product>> => {
    return timer(1000).pipe(map(() => ({
      items: request.columnFilters.length ? [] : data().slice(request.start, request.end),
      totalCount: request.columnFilters.length ? 0 : data().length,
    })));
  };
}
