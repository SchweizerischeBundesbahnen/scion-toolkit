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
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {createDestroyableInjector} from '@scion/components/common';
import {HttpClient} from '@angular/common/http';
import {CustomColumnComponent} from './custom-column.component';
import {SciViewportComponent} from '@scion/components/viewport';
import {provideAsyncTreeDatasource, provideTreeDatasource, SciTree, SciTreeComponent, SciTreeNodeContext, tree} from '@scion/components/tree';
import {mergeWith, noop} from 'rxjs';
import {provideTableRowBinding, SciTableTreeNode} from '@scion/components/table';
import {Product, ProductService} from './sci-tree-page.data';
import {simulateError$} from '../sci-table/sci-table-page.data';

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
    '[style.--sci-tree-node-height]': 'settingsForm.nodeHeight().value() !== null ? `${settingsForm.nodeHeight().value()}px` : null',
  },
  imports: [
    FormsModule,
    FormField,
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
  protected readonly activeItemId = computed(() => this.tree()?.activeItem());
  protected readonly selectedItems = computed(() => this.tree()?.selectedItems());
  protected readonly selection = computed(() => this.tree()?.selectedItems().sort((a, b) => a - b).join(' '));

  constructor() {
    this.bindTreeSettings();
  }

  private createTree(options: {datasource: 'array' | 'array-http' | 'loader' | 'loader-delayed' | 'loader-http'; showNodeActions: boolean; customRowStyling: boolean; bufferSize: number; pageSize: number}): SciTree<number> {
    return tree({
      label: product => product.name,
      datasource: (() => {
        switch (options.datasource) {
          case 'array':
            return provideTreeDatasource(this._productService.products, item => item.children ?? []);
          case 'array-http':
            this._productService.enableHttpLoader();
            return provideTreeDatasource(this._productService.products, item => item.children ?? []);
          case 'loader':
          case 'loader-delayed': {
            const delayed = options.datasource === 'loader-delayed';
            return provideAsyncTreeDatasource(
              request => this._productService.getProductsIds$(request, {slowDatasource: delayed, simulateError: this.datasourceForm.simulateError().value}),
              ids => this._productService.getProductsById$(ids, {slowDatasource: delayed, simulateError: this.datasourceForm.simulateError().value}),
            );
          }
          case 'loader-http':
            return provideAsyncTreeDatasource(
              request => this._httpClient.post<SciTableTreeNode<number>[]>('/sci-table/products/ids', request).pipe(mergeWith(simulateError$(this.datasourceForm.simulateError().value))),
              ids => this._httpClient.post<Product[]>('/sci-table/products', ids).pipe(mergeWith(simulateError$(this.datasourceForm.simulateError().value))),
            );
          default:
            return provideTreeDatasource(this._productService.products, item => item.children ?? []);
        }
      })(),
      filterable: this.settingsForm.customFilter().value() ? {matcher: customFilter} : undefined,
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

  private computeTrees(): Signal<SciTree<number>[]> {
    const trees = signal<SciTree<number>[]>([]);

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
      filterable: false,
      selectable: 'multi',
      showNodeActions: false,
      customRowStyling: false,
      nodeHeight: 30,
      treeCount: 1,
      customFilter: false,
    }));
  }

  private createMethodsForm(): FieldTree<MethodsForm> {
    return form(signal<MethodsForm>({
      selectId: '',
    }));
  }

  private createDatasourceForm(): FieldTree<DatasourceForm> {
    return form(signal<DatasourceForm>({
      datasource: 'array',
      bufferSize: 10,
      pageSize: 50,
      simulateError: false,
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
        tree.filterable.set(this.settingsForm.filterable().value());

        const selectable = this.settingsForm.selectable().value();
        tree.selectable.set(selectable === 'false' ? false : selectable);
      });
    });
  }

  protected onExpandAll(): void {
    this.tree()?.expandAll();
  }

  protected onCollapseAll(): void {
    this.tree()?.collapseAll();
  }

  protected onSelect(): void {
    this.tree()?.select(this.methodsForm.selectId().value().split(' ').map(Number));
    this.methodsForm.selectId().reset('');
  }
}

interface SettingsForm {
  filterable: boolean;
  selectable: 'false' | 'single' | 'multi';
  showNodeActions: boolean;
  customRowStyling: boolean;
  nodeHeight: number | null;
  treeCount: number;
  customFilter: boolean;
}

interface MethodsForm {
  selectId: string;
}

interface DatasourceForm {
  datasource: 'array' | 'array-http' | 'loader' | 'loader-delayed' | 'loader-http';
  bufferSize: number;
  pageSize: number;
  simulateError: boolean;
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
