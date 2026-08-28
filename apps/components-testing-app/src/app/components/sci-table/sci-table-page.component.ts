/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, inject, Injector, input, inputBinding, runInInjectionContext, Signal, signal, TemplateRef, untracked, viewChild} from '@angular/core';
import {SciCellContext, SciColumnDescriptor, SciColumnType, SciTable, SciTableComponent, SciTableRequest, SciTableResponse, table} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, pattern, required} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {createDestroyableInjector} from '@scion/components/common';
import {SciIconComponent} from '@scion/components/icon';
import {FieldValidationDirective} from '../field-validation.directive';
import {Product, ProductService} from './sci-table-page.data';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  host: {
    '[style.--table-page-height]': 'settingsForm.height().value() ? `${settingsForm.height().value()}px` : null',
    '[style.--table-page-width]': 'settingsForm.width().value() ? `${settingsForm.width().value()}px` : null',
    '[style.--sci-table-row-height]': 'settingsForm.rowHeight().value() ? `${settingsForm.rowHeight().value()}px` : null',
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
    FieldValidationDirective,
  ],
})
export default class SciTablePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _productService = inject(ProductService);
  private readonly _httpClient = inject(HttpClient);

  private readonly _cellTemplate = viewChild.required<TemplateRef<Product>>('cell');

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly columnForm: FieldTree<ColumnForm> = this.createColumnForm();
  protected readonly columns = signal<ColumnForm[]>([]);

  protected readonly tables = this.computeTables();
  protected readonly rowCount = inject(ProductService).productCount;
  protected readonly selectedItems = computed(() => this.tables()[0]?.selectedItems());

  private createTable(name: `table:${string}`, options: {datasource: 'array' | 'loader' | 'loader-delayed' | 'loader-http'; showRowActions: boolean; customRowStyling: boolean}): SciTable<Product> {
    return table({
      name,
      headerVisible: computed(() => this.settingsForm.showHeader().value()),
      gridlinesVisible: computed(() => this.settingsForm.showGridlines().value()),
      sortable: computed(() => this.settingsForm.sortable().value()),
      filterable: computed(() => this.settingsForm.filterable().value()),
      resizable: computed(() => this.settingsForm.resizable().value()),
      selectable: computed(() => {
        const selectable = this.settingsForm.selectable().value();
        return selectable === 'false' ? false : selectable;
      }),
      data: (() => {
        switch (options.datasource) {
          case 'loader':
            return (request: SciTableRequest) => this._productService.getProducts$(request, columnDataTypes(this.columns()), {slowDataSource: false});
          case 'loader-delayed':
            return (request: SciTableRequest) => this._productService.getProducts$(request, columnDataTypes(this.columns()), {slowDataSource: true});
          case 'loader-http':
            return (request: SciTableRequest) => this._httpClient.post<SciTableResponse<Product>>('/sci-table/products', request);
          default:
            return this._productService.products;
        }
      })(),
      rowBindings: (options.customRowStyling || undefined) && ((product: Product) => {
        if (product.id % 3 === 0) {
          return {part: 'row:negative'};
        }
        return undefined;
      }),
      rowActions: options.showRowActions ? (product, toolbar) => toolbar.addToolbarMenu({icon: 'scion.more_vertical', visualMenuIndicator: false}, menu => menu
        .addMenuItem({
          label: 'Edit',
          onSelect: () => console.log('edit', product.id),
        }),
      ) : undefined,
      trackBy: product => product.id,
      bufferSize: computed(() => this.settingsForm.bufferSize().value()),
    }, table => this.columns().forEach(columnForm => {
      if (!columnForm.visible()) {
        return;
      }

      const column: SciColumnDescriptor = {
        name: columnForm.name || undefined,
        header: columnForm.header || undefined,
        width: columnForm.width || undefined,
        minWidth: columnForm.minWidth ?? undefined,
        maxWidth: columnForm.maxWidth ?? undefined,
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
            template: () => ({template: this._cellTemplate}),
          });
          break;
      }
    }));
  }

  private computeTables(): Signal<SciTable<Product>[]> {
    const tables = signal<SciTable<Product>[]>([]);

    effect(onCleanup => {
      const tableCount = this.settingsForm.tableCount().value();
      const datasource = this.settingsForm.datasource().value();
      const showRowActions = this.settingsForm.showRowAction().value();
      const customRowStyling = this.settingsForm.customRowStyling().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        tables.set(Array.from(Array(tableCount), (_, i) => runInInjectionContext(injector, () => this.createTable(`table:${i}`, {datasource, showRowActions, customRowStyling}))));
      });
    });

    return tables;
  }

  private createColumnForm(): FieldTree<ColumnForm> {
    return form(signal<ColumnForm>(defaults()), column => {
      pattern(column.name, /column:.+/);
      required(column.name);
      required(column.type);
    }, {
      submission: {
        action: async form => {
          this.columns.update(columns => columns.concat({
            ...form().value(),
            header: form.header().value() || form.name().value(),
            visible: signal(true),
          }));
          this.columnForm().reset(defaults());
        },
      },
    });

    function defaults(): ColumnForm {
      return {
        name: 'column:',
        type: 'string',
        header: '',
        resizable: true,
        width: '',
        minWidth: null,
        maxWidth: null,
        customSort: false,
        customFilter: false,
        visible: signal(true),
      };
    }
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    const defaults: SettingsForm = {
      filterable: true,
      sortable: true,
      resizable: true,
      selectable: 'multi',
      showHeader: true,
      showGridlines: false,
      showRowAction: false,
      datasource: 'array',
      bufferSize: 10,
      customRowStyling: false,
      rowHeight: 30,
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
  name: `column:${string}` | '';
  type: SciColumnType;
  header: string;
  resizable: boolean;
  width: string;
  minWidth: number | null;
  maxWidth: number | null;
  customSort: boolean;
  customFilter: boolean;
  visible: Signal<boolean>;
}

interface SettingsForm {
  filterable: boolean;
  sortable: boolean;
  resizable: boolean;
  selectable: 'false' | 'single' | 'multi';
  showHeader: boolean;
  showGridlines: boolean;
  showRowAction: boolean;
  datasource: 'array' | 'loader' | 'loader-delayed' | 'loader-http';
  bufferSize: number;
  customRowStyling: boolean;
  rowHeight: number;
  height: number;
  width: number;
  tableCount: number;
}

function customFilter(text: string, context: SciCellContext<Product, unknown>): boolean {
  return context.item.name.includes(text);
}

function customComparator(a: SciCellContext<Product, unknown>, b: SciCellContext<Product, unknown>): number {
  return a.item.id - b.item.id;
}

function columnDataTypes(columns: ColumnForm[]): Map<`column:${string}`, ColumnForm['type']> {
  return columns.reduce((map, column) => map.set(column.name as `column:${string}`, column.type), new Map<`column:${string}`, ColumnForm['type']>());
}
