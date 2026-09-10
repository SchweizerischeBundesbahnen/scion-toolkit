/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, inject, Injector, inputBinding, runInInjectionContext, Signal, signal, TemplateRef, untracked, viewChild, WritableSignal} from '@angular/core';
import {attributeBinding, partBinding, provideTableRowBinding, SciCellContext, SciColumnDescriptor, SciColumnType, SciTable, SciTableComponent, SciTableRequest, SciTableResponse, table} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, pattern, required} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {createDestroyableInjector} from '@scion/components/common';
import {FieldValidationDirective} from '../field-validation.directive';
import {Product, ProductService} from './sci-table-page.data';
import {HttpClient} from '@angular/common/http';
import {noop} from 'rxjs';
import {CustomColumnComponent} from './custom-column.component';
import {SciViewportComponent} from '@scion/components/viewport';

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrl: './sci-table-page.component.scss',
  host: {
    '[style.--table-height]': 'layoutForm.tableHeight().value() !== null ? `${layoutForm.tableHeight().value()}px` : null',
    '[style.--table-max-height]': 'layoutForm.tableMaxHeight().value() !== null ? `${layoutForm.tableMaxHeight().value()}px` : null',
    '[style.--table-width]': 'layoutForm.tableWidth().value() !== null ? `${layoutForm.tableWidth().value()}px` : null',
    '[style.--table-grow-to-breakpoint]': 'layoutForm.tableGrowToBreakpoint().value() ? `true` : null',
    '[style.--table-page-height]': 'layoutForm.pageHeight().value() !== null ? `${layoutForm.pageHeight().value()}px` : null',
    '[style.--sci-table-row-height]': 'settingsForm.rowHeight().value() !== null ? `${settingsForm.rowHeight().value()}px` : null',
  },
  imports: [
    SciTableComponent,
    FormsModule,
    FormField,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
    FormRoot,
    FieldValidationDirective,
    CustomColumnComponent,
    SciViewportComponent,
  ],
  providers: [
    provideTableRowBinding([
      // Add row index attribute to locate rows by dataset index.
      attributeBinding((_item, index) => ({'data-row-index': index})),
    ]),
  ],
})
export default class SciTablePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _productService = inject(ProductService);
  private readonly _httpClient = inject(HttpClient);

  private readonly _customColumnTemplate = viewChild.required<TemplateRef<Product>>('custom_column_template');

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly datasourceForm: FieldTree<DatasourceForm> = this.createDatasourceForm();
  protected readonly layoutForm: FieldTree<LayoutForm> = this.createLayoutForm();
  protected readonly columnForm: FieldTree<ColumnForm> = this.createColumnForm();
  protected readonly columns = signal<ColumnForm[]>([]);

  protected readonly tables = this.computeTables();
  protected readonly rowCount = inject(ProductService).productCount;
  protected readonly activeItemId = computed(() => this.tables()[0]?.activeItem()?.id);
  protected readonly selectedItems = computed(() => this.tables()[0]?.selectedItems());
  protected readonly selection = computed(() => this.tables()[0]?.selectedItems().map(item => item.id).sort((a, b) => a - b).join(' '));

  constructor() {
    this.bindTableSettings();
  }

  private createTable(options: {datasource: 'array' | 'array-http' | 'loader' | 'loader-delayed' | 'loader-http'; showRowActions: boolean; customRowStyling: boolean; bufferSize: number; pageSize: number}): SciTable<Product> {
    return table({
      data: (() => {
        switch (options.datasource) {
          case 'array':
            return this._productService.products;
          case 'array-http':
            this._productService.enableHttpLoader();
            return this._productService.products;
          case 'loader':
            return (request: SciTableRequest) => this._productService.getProducts$(request, columnDataTypes(this.columns()), {slowDataSource: false});
          case 'loader-delayed':
            return (request: SciTableRequest) => this._productService.getProducts$(request, columnDataTypes(this.columns()), {slowDataSource: true});
          case 'loader-http':
            return (request: SciTableRequest) => this._httpClient.post<SciTableResponse<Product>>('/sci-table/products', request);
        }
      })(),
      rowBindings: options.customRowStyling ? [
        partBinding(product => product.id % 3 === 0 ? 'row:negative' : undefined),
      ] : undefined,
      rowActions: options.showRowActions ? (product, toolbar) => toolbar
        .addToolbarButton({icon: 'scion.edit', onSelect: noop})
        .addToolbarButton({icon: 'scion.delete', onSelect: noop})
        .addToolbarButton({icon: 'scion.pin', onSelect: noop})
        .addToolbarButton({icon: 'scion.search', onSelect: noop})
        .addToolbarMenu({icon: 'scion.more_vertical', visualMenuIndicator: false, cssClass: 'e2e-more'}, menu => menu
          .addMenuItem({
            label: 'Edit',
            onSelect: () => console.log('edit', product.id),
          }),
        ) : undefined,
      trackBy: product => product.id,
      bufferSize: options.bufferSize,
      pageSize: options.pageSize,
    }, table => this.columns().forEach(columnForm => {
      if (!columnForm.visible()) {
        return;
      }

      const column: SciColumnDescriptor = {
        name: columnForm.name || undefined,
        label: columnForm.label || undefined,
        width: columnForm.width || undefined,
        minWidth: columnForm.minWidth ?? undefined,
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
            padding: columnForm.padding,
            component: product => ({
              component: CustomColumnComponent,
              bindings: [
                inputBinding('product', () => product),
              ],
            }),
          });
          break;
        case 'template':
          table.addTemplateColumn({
            ...column,
            filterable: columnForm.customFilter ? {matcher: customFilter} : undefined,
            sortable: columnForm.customSort ? {comparator: customComparator} : undefined,
            padding: columnForm.padding,
            template: () => ({
              template: this._customColumnTemplate,
            }),
          });
          break;
      }
    }));
  }

  private computeTables(): Signal<SciTable<Product>[]> {
    const tables = signal<SciTable<Product>[]>([]);

    effect(onCleanup => {
      const tableCount = this.settingsForm.tableCount().value();
      const datasource = this.datasourceForm.datasource().value();
      const showRowActions = this.settingsForm.showRowActions().value();
      const customRowStyling = this.settingsForm.customRowStyling().value();
      const bufferSize = this.datasourceForm.bufferSize().value();
      const pageSize = this.datasourceForm.pageSize().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        tables.set(Array.from(Array(tableCount), (_, i) => runInInjectionContext(injector, () => this.createTable({datasource, showRowActions, customRowStyling, bufferSize, pageSize}))));
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
            label: form.label().value() || form.name().value(),
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
        label: '',
        resizable: true,
        padding: true,
        width: '',
        minWidth: null,
        customSort: false,
        customFilter: false,
        visible: signal(true),
      };
    }
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    return form(signal<SettingsForm>({
      filterable: false,
      sortable: true,
      resizable: true,
      selectable: 'multi',
      showHeader: true,
      wrapHeader: false,
      showGridlines: false,
      showRowActions: false,
      customRowStyling: false,
      rowHeight: 30,
      tableCount: 1,
    }));
  }

  private createDatasourceForm(): FieldTree<DatasourceForm> {
    return form(signal<DatasourceForm>({
      datasource: 'array',
      bufferSize: 10,
      pageSize: 50,
    }));
  }

  private createLayoutForm(): FieldTree<LayoutForm> {
    return form(signal<LayoutForm>({
      tableHeight: null,
      tableMaxHeight: null,
      tableWidth: null,
      tableGrowToBreakpoint: false,
      pageHeight: null,
    }));
  }

  private bindTableSettings(): void {
    effect(() => {
      this.tables().forEach(table => {
        table.showHeader.set(this.settingsForm.showHeader().value());
        table.wrapHeader.set(this.settingsForm.wrapHeader().value());
        table.sortable.set(this.settingsForm.sortable().value());
        table.filterable.set(this.settingsForm.filterable().value());
        table.resizable.set(this.settingsForm.resizable().value());

        const selectable = this.settingsForm.selectable().value();
        table.selectable.set(selectable === 'false' ? false : selectable);
      });
    });
  }
}

interface ColumnForm {
  name: `column:${string}` | '';
  type: SciColumnType;
  label: string;
  resizable: boolean;
  padding: boolean;
  width: string;
  minWidth: number | null;
  customSort: boolean;
  customFilter: boolean;
  visible: WritableSignal<boolean>;
}

interface SettingsForm {
  filterable: boolean;
  sortable: boolean;
  resizable: boolean;
  selectable: 'false' | 'single' | 'multi';
  showHeader: boolean;
  wrapHeader: boolean;
  showGridlines: boolean;
  showRowActions: boolean;
  customRowStyling: boolean;
  rowHeight: number | null;
  tableCount: number;
}

interface DatasourceForm {
  datasource: 'array' | 'array-http' | 'loader' | 'loader-delayed' | 'loader-http';
  bufferSize: number;
  pageSize: number;
}

interface LayoutForm {
  tableHeight: number | null;
  tableMaxHeight: number | null;
  tableWidth: number | null;
  tableGrowToBreakpoint: boolean;
  pageHeight: number | null;
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
