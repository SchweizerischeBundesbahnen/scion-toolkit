/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, ElementRef, inject, Injector, linkedSignal, runInInjectionContext, Signal, signal, untracked, viewChild} from '@angular/core';
import {ɵprovideTreeDatasource, provideTreeDatasource, SciTree, SciTreeComponent, tree} from '@scion/components/tree';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField} from '@angular/forms/signals';
import {ɵcreateDestroyableInjector} from '@scion/components/common';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {createDesignTokenForm, DesignTokenForm, DesignTokenFormComponent} from '../styles/design-token-form.component';
import {SciTableDatasourceProvider} from '@scion/components/table';
import {fileExtensionIcons, FileNode, files} from './sci-tree-page.data';
import {map, timer} from 'rxjs';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {contributeMenu} from '@scion/components/menu';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-tree-page',
  templateUrl: './sci-tree-page.component.html',
  styleUrl: './sci-tree-page.component.scss',
  imports: [
    FormsModule,
    FormField,
    SciTabDirective,
    SciTabbarComponent,
    SciTreeComponent,
    DesignTokenFormComponent,
    SciFilterFieldComponent,
  ],
})
export default class SciTreePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _treeElement: Signal<ElementRef<HTMLElement> | undefined> = viewChild(SciTreeComponent, {read: ElementRef});
  private readonly _isMobile = toSignal(inject(BreakpointObserver).observe('(max-width: 700px)').pipe(map(breakpoint => breakpoint.matches)));
  private readonly _files = signal(files);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly designTokenForm: FieldTree<DesignTokenForm> = this.createDesignTokenForm();

  protected readonly tree = this.computeTree();
  protected readonly selectable = computed(() => {
    const selectable = this.tree()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly panelOpen = linkedSignal(() => !this._isMobile());
  protected readonly host = inject(ElementRef).nativeElement as HTMLElement;

  constructor() {
    this.contributeMainToolbarMenu();
  }

  private createTree(options: {slowDatasource: boolean}): SciTree<string> {
    return tree<FileNode, string>({
      label: item => item.name,
      datasource: this.getDatasource(options),
      trackBy: item => item.id,
      nodeBindings: (node, item) => {
        const extension = item.name.split('.').pop()!.toLowerCase();
        node.addIconBinding(item.children.length ? 'scion:folder' : fileExtensionIcons.get(extension) ?? 'format_align_left');
      },
    });
  }

  private computeTree(): Signal<SciTree<string> | undefined> {
    const tree = signal<SciTree<string> | undefined>(undefined);

    effect(onCleanup => {
      const slowDatasource = this.settingsForm.slowDatasource().value();

      untracked(() => {
        const injector = ɵcreateDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        tree.set(runInInjectionContext(injector, () => this.createTree({slowDatasource})));
      });
    });

    return tree;
  }

  private getDatasource(options: {slowDatasource: boolean}): SciTableDatasourceProvider<FileNode, string> {
    if (options.slowDatasource) {
      const files = this._files().flatMap(file => [file, ...file.children]);
      return ɵprovideTreeDatasource<FileNode, string>({
        getTreeNodes: query => timer(1000).pipe(map(() => files
          .filter(file => query.filter ? file.name.toLowerCase().includes(query.filter.toLowerCase()) : true)
          .map(file => ({id: file.id, parentId: file.parentId})))),
        getItems: ids => timer(1000).pipe(map(() => files.filter(file => ids.includes(file.id)))),
      });
    }

    return provideTreeDatasource<FileNode>(this._files, item => item.children);
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    return form(signal({
      slowDatasource: false,
    }));
  }

  private createDesignTokenForm(): FieldTree<DesignTokenForm> {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    return createDesignTokenForm([
      '--sci-tree-node-height',
      '--sci-tree-node-indent',
      '--sci-tree-node-background-color-hover',
      '--sci-tree-node-background-color-selected',
      '--sci-tree-node-border-radius',
      '--sci-tree-node-outline-color',
      '--sci-tree-node-outline-width',
      '--sci-tree-node-outline-style',
      '--sci-tree-node-action-background-color',
      '--sci-tree-node-action-background-color-selected',
    ], this._treeElement, {designTokenRootElement: host});
  }

  private contributeMainToolbarMenu(): void {
    contributeMenu('toolbar:main', toolbar => toolbar
      .addToolbarButton({visible: this.panelOpen(), icon: 'right_panel_close', tooltip: 'Hide side panel', onSelect: () => this.panelOpen.set(false)})
      .addToolbarButton({visible: computed(() => !this.panelOpen()), icon: 'right_panel_open', tooltip: 'Show side panel', onSelect: () => this.panelOpen.set(true)}),
    );
  }

  protected updateSelectable(selectable: 'multi' | 'single' | 'false'): void {
    this.tree()?.selectable.set(selectable === 'false' ? false : selectable);
  }

  protected onTreeFilter(filter: string): void {
    this.tree()!.filter(filter);
  }
}

interface SettingsForm {
  slowDatasource: boolean;
}
