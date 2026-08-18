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
import {SciCellContext, SciColumnDescriptor, SciTable, SciTableComponent, SciTableFactory, SciTableRequest, SciTableResponse, table} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, required} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {map, Observable, timer} from 'rxjs';
import {createDestroyableInjector} from '@scion/components/common';

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
  ],
})
export default class SciTablePageComponent {

  public readonly type = input<'slow' | undefined>();

  private readonly _injector = inject(Injector);

  protected readonly settingsForm = this.createSettingsForm();
  protected readonly columnForm: FieldTree<ColumnForm> = this.createColumnForm();

  protected readonly data = computed(() => generateData(this.settingsForm.rowCount().value()));
  protected readonly tables = signal<SciTable<Product>[]>([]);
  protected readonly columns = signal<ColumnForm[]>([]);

  private readonly cellTemplate = viewChild.required<TemplateRef<Product>>('cell');
  protected readonly selectedItems = computed(() => this.tables()[0]?.selectedItems());

  constructor() {
    this.createTables();
  }

  private createTables(): void {
    effect(onCleanup => {
      const tableCount = this.settingsForm.tableCount().value();
      const showRowActions = this.settingsForm.showRowAction().value();
      const conditionallyStyleRow = this.settingsForm.conditionallyStyleRow().value();
      const type = this.type();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());

        this.tables.set(Array.from(Array(tableCount), (_, i) => this.createTable({
          name: `table:${i}`,
          slowDataSource: type === 'slow',
          conditionalRowStyling: conditionallyStyleRow,
          showRowActions: showRowActions,
          injector,
        })));
      });
    });
  }

  private createTable(options: {name: `table:${string}`, slowDataSource: boolean, showRowActions: boolean, conditionalRowStyling: boolean, injector: Injector}): SciTable<Product> {
    const cellTemplate = this.cellTemplate;

    return table({
      name: options.name,
      headerVisible: computed(() => this.settingsForm.showHeader().value()),
      sortable: computed(() => this.settingsForm.sortable().value()),
      filterable: computed(() => this.settingsForm.filterable().value()),
      resizable: computed(() => this.settingsForm.resizable().value()),
      selectable: computed<false | 'single' | 'multi'>(() => {
        const selectable = this.settingsForm.selectable().value();
        return selectable === 'false' ? false : selectable;
      }),
      data: options.slowDataSource ? slowDataLoader(this.data) : this.data,
      rowState: options.conditionalRowStyling ? (row: Product) => row.id % 3 === 0 ? 'row:red' : [] : undefined,
      rowActions: options.showRowActions ? createRowActions() : undefined,
    }, table => this.columns().forEach(column => addColumn(table, column)), {injector: options.injector});

    function addColumn(table: SciTableFactory<Product>, columnForm: ColumnForm): void {
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
            sortable: columnForm.customSort ? {comparator: customSort} : undefined,
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
            sortable: columnForm.customSort ? {comparator: customSort} : undefined,
            component: product => ({component: CustomCellComponent, bindings: [inputBinding('product', () => product)]}),
          });
          break;
        case 'template':
          table.addTemplateColumn({
            ...column,
            filterable: columnForm.customFilter ? {matcher: customFilter} : undefined,
            sortable: columnForm.customSort ? {comparator: customSort} : undefined,
            template: () => ({template: cellTemplate}),
          });
          break;
      }
    }

    function createRowActions(): SciRowActionFactoryFn<Product> {
      return (item, toolbar) => toolbar.addToolbarMenu({icon: 'scion.more_vertical', visualMenuIndicator: false}, menu => menu
        .addMenuItem({
          label: 'Edit',
          onSelect: () => console.log('edit', item.id),
        }),
      );
    }
  }

  private createColumnForm(): FieldTree<ColumnForm> {
    return form(signal<ColumnForm>(createDefaultColumn()), column => {
        required(column.type);
        required(column.header);
      }, {
        submission: {
          action: async form => {
            this.columns.update(columns => columns.concat(form().value()));
            this.columnForm().reset(createDefaultColumn());
          },
        },
      },
    );
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    const settings: SettingsForm = {
      filterable: true,
      sortable: true,
      resizable: true,
      selectable: 'multi',
      showHeader: true,
      showRowAction: false,
      slowDataSource: false,
      conditionallyStyleRow: false,
      rowCount: 10000,
      rowSize: 28,
      height: 600,
      width: 600,
      tableCount: 1,
    };
    return form(signal(settings));
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
  conditionallyStyleRow: boolean;
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

function createDefaultColumn(): ColumnForm {
  return {
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
}

function generateData(length: number = 10_000): Product[] {
  return Array.from(Array(length), (_, i) => ({
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
    return timer(1000).pipe(map(() => ({
      items: request.columnFilters.length ? [] : data().slice(request.start, request.end),
      totalCount: request.columnFilters.length ? 0 : data().length,
    })));
  };
}
