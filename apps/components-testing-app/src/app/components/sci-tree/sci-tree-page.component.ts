/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, inject, Injector, runInInjectionContext, Signal, signal, TemplateRef, untracked, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField} from '@angular/forms/signals';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {createDestroyableInjector} from '@scion/components/common';
import {Product, ProductService} from './sci-table-page.data';
import {HttpClient} from '@angular/common/http';
import {CustomColumnComponent} from './custom-column.component';
import {SciViewportComponent} from '@scion/components/viewport';
import {provideTreeDatasource, SciTree, SciTreeComponent, SciTreeNodeContext, tree} from '@scion/components/tree';
import {noop} from 'rxjs';
import {provideTableRowBinding} from '@scion/components/table';

@Component({
  selector: 'app-tree-page',
  templateUrl: './sci-tree-page.component.html',
  styleUrl: './sci-tree-page.component.scss',
  host: {
    '[style.--tree-height]': 'layoutForm.treeHeight().value() !== null ? `${layoutForm.treeHeight().value()}px` : null',
    '[style.--tree-max-height]': 'layoutForm.treeMaxHeight().value() !== null ? `${layoutForm.treeMaxHeight().value()}px` : null',
    '[style.--tree-width]': 'layoutForm.treeWidth().value() !== null ? `${layoutForm.treeWidth().value()}px` : null',
    '[style.--tree-grow-to-breakpoint]': 'layoutForm.treeGrowToBreakpoint().value() ? `true` : null',
    '[style.--tree-page-height]': 'layoutForm.pageHeight().value() !== null ? `${layoutForm.pageHeight().value()}px` : null',
    '[style.--sci-table-row-height]': 'settingsForm.rowHeight().value() !== null ? `${settingsForm.rowHeight().value()}px` : null',
  },
  imports: [
    FormsModule,
    FormField,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
    CustomColumnComponent,
    SciViewportComponent,
    SciTreeComponent,
  ],

  providers: [
    provideTableRowBinding((bindings, _item, index) => {
      // Add row index attribute to locate rows by dataset index.
      bindings.addAttributeBinding('data-row-index', index);
    }),
  ],
})
export default class SciTreePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _productService = inject(ProductService);
  private readonly _httpClient = inject(HttpClient);

  private readonly _customColumnTemplate = viewChild.required<TemplateRef<Product>>('custom_column_template');

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly methodsForm: FieldTree<MethodsForm> = this.createMethodsForm();
  protected readonly datasourceForm: FieldTree<DatasourceForm> = this.createDatasourceForm();
  protected readonly layoutForm: FieldTree<LayoutForm> = this.createLayoutForm();

  protected readonly trees = this.computeTrees();
  protected readonly tree = computed(() => this.trees()[0]);
  protected readonly rowCount = inject(ProductService).productCount;
  protected readonly activeItemId = computed(() => this.tree()?.activeItem()?.id);
  protected readonly selectedItems = computed(() => this.tree()?.selectedItems());
  protected readonly selection = computed(() => this.tree()?.selectedItems().map(item => item.id).sort((a, b) => a - b).join(' '));

  constructor() {
    this.bindTreeSettings();
  }

  private createTree(options: {datasource: 'array' | 'array-http' | 'loader' | 'loader-delayed' | 'loader-http'; showNodeActions: boolean; customRowStyling: boolean; bufferSize: number; pageSize: number}): SciTree<Product> {
    return tree<Product>({
      label: product => product.name,
      datasource: (() => {
        switch (options.datasource) {
          case 'array':
            return provideTreeDatasource(this._productService.products, {
              getChildren: item => item.children ?? [],
              hasChildren: item => !!item.children,
            });
          case 'array-http':
            this._productService.enableHttpLoader();
            return provideTreeDatasource(this._productService.products, {
              getChildren: item => item.children ?? [],
              hasChildren: item => !!item.children,
            });
          default:
            return provideTreeDatasource(this._productService.products, {
              getChildren: item => item.children ?? [],
              hasChildren: item => !!item.children,
            });
          //   case 'loader':
          //     return (request: SciTableRequest) => this._productService.getProducts$(request, columnDataTypes(this.columns()), {slowDataSource: false});
          //   case 'loader-delayed':
          //     return (request: SciTableRequest) => this._productService.getProducts$(request, columnDataTypes(this.columns()), {slowDataSource: true});
          //   case 'loader-http':
          //     return (request: SciTableRequest) => this._httpClient.post<SciTableResponse<Product>>('/sci-table/products', request);
          // }
        }
      })(),
      filterable: this.settingsForm.customFilter().value() ? {matcher: customFilter} : undefined,
      sortable: this.settingsForm.customSort().value() ? {comparator: customComparator} : undefined,
      nodeActions: options.showNodeActions ? (toolbar, product) => toolbar
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
    });
  }

  private computeTrees(): Signal<SciTree<Product>[]> {
    const trees = signal<SciTree<Product>[]>([]);

    effect(onCleanup => {
      const treeCount = this.settingsForm.treeCount().value();
      const datasource = this.datasourceForm.datasource().value();
      const showNodeActions = this.settingsForm.showNodeActions().value();
      const customRowStyling = this.settingsForm.customRowStyling().value();
      const bufferSize = this.datasourceForm.bufferSize().value();
      const pageSize = this.datasourceForm.pageSize().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        trees.set(Array.from(Array(treeCount), (_, i) => runInInjectionContext(injector, () => this.createTree({datasource, showNodeActions: showNodeActions, customRowStyling, bufferSize, pageSize}))));
      });
    });

    return trees;
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    return form(signal<SettingsForm>({
      header: '',
      filterable: false,
      sortable: true,
      selectable: 'multi',
      wrapHeader: false,
      showNodeActions: false,
      customRowStyling: false,
      rowHeight: 30,
      treeCount: 1,
      customFilter: false,
      customSort: false,
    }));
  }

  private createMethodsForm(): FieldTree<MethodsForm> {
    return form(signal<MethodsForm>({
      expandById: 0,
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
      treeHeight: null,
      treeMaxHeight: null,
      treeWidth: null,
      treeGrowToBreakpoint: false,
      pageHeight: null,
    }));
  }

  private bindTreeSettings(): void {
    effect(() => {
      this.trees().forEach(tree => {
        tree.header.set(this.settingsForm.header().value());
        tree.wrapHeader.set(this.settingsForm.wrapHeader().value());
        tree.sortable.set(this.settingsForm.sortable().value());
        tree.filterable.set(this.settingsForm.filterable().value());

        const selectable = this.settingsForm.selectable().value();
        tree.selectable.set(selectable === 'false' ? false : selectable);
      });
    });
  }

  protected onExpand(): void {
    const id = this.methodsForm.expandById().value();
    this.tree()?.expand(id);
    this.methodsForm.expandById().reset(0);
  }

  protected onExpandAll(): void {
    this.tree()?.expandAll();
  }
}

interface SettingsForm {
  header: string;
  filterable: boolean;
  sortable: boolean;
  selectable: 'false' | 'single' | 'multi';
  wrapHeader: boolean;
  showNodeActions: boolean;
  customRowStyling: boolean;
  rowHeight: number | null;
  treeCount: number;
  customFilter: boolean;
  customSort: boolean;
}

interface MethodsForm {
  expandById: number;
}

interface DatasourceForm {
  datasource: 'array' | 'array-http' | 'loader' | 'loader-delayed' | 'loader-http';
  bufferSize: number;
  pageSize: number;
}

interface LayoutForm {
  treeHeight: number | null;
  treeMaxHeight: number | null;
  treeWidth: number | null;
  treeGrowToBreakpoint: boolean;
  pageHeight: number | null;
}

function customFilter(text: string, context: SciTreeNodeContext<Product>): boolean {
  return context.item.name.includes(text);
}

function customComparator(a: SciTreeNodeContext<Product>, b: SciTreeNodeContext<Product>): number {
  return a.item.id - b.item.id;
}
