/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, ElementRef, inject, Injector, runInInjectionContext, Signal, signal, untracked, viewChild} from '@angular/core';
import {provideAsyncTreeDatasource, provideTreeDatasource, SciTree, SciTreeComponent, tree} from '@scion/components/tree';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField} from '@angular/forms/signals';
import {ɵcreateDestroyableInjector} from '@scion/components/common';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {Router} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {createDesignTokenForm, DesignTokenForm, DesignTokenFormComponent} from '../styles/design-token-form.component';
import {SciTableDatasourceFactory, SciTableTreeNode} from '@scion/components/table';
import {fileExtensionIcons, FileNode, files} from './sci-tree-page.data';
import {map, timer} from 'rxjs';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';

@Component({
  selector: 'app-tree-page',
  templateUrl: './sci-tree-page.component.html',
  styleUrl: './sci-tree-page.component.scss',
  imports: [
    FormsModule,
    FormField,
    SciTabDirective,
    SciTabbarComponent,
    SciViewportComponent,
    SciTreeComponent,
    DesignTokenFormComponent,
    SciFilterFieldComponent,
  ],
})
export default class SciTreePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _router = inject(Router);
  private readonly _treeElement: Signal<ElementRef<HTMLElement> | undefined> = viewChild(SciTreeComponent, {read: ElementRef});
  private readonly _files = signal(files);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly methodsForm: FieldTree<MethodsForm> = this.createMethodsForm();
  protected readonly designTokenForm: FieldTree<DesignTokenForm> = this.createDesignTokenForm();

  protected readonly tree = this.computeTree();
  protected readonly selectable = computed(() => {
    const selectable = this.tree()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly selection = computed(() => this.tree()?.selectedItems().sort((a, b) => a.localeCompare(b)).join(' '));
  protected readonly host = inject(ElementRef).nativeElement as HTMLElement;

  constructor() {
    // const fileTree = tree({
    //   label: file => file.name,
    //   datasource: provideTreeDatasource<FileNode, string>(this._files, file => file.children ?? []),
    //   filterable: {matcher: (text, context) => matchesFile(context.item, text)}, // `matchesFile` is illustrative
    // });

    // const fileTree = tree({
    //   label: {
    //     component: file => ({
    //       component: FileComponent,
    //       bindings: [
    //         inputBinding('name', () => file.name),
    //       ],
    //     }),
    //   },
    //   datasource: provideTreeDatasource<FileNode, string>(this._files, file => file.children ?? []),
    //   filterable: {matcher: (text, context) => matchesFile(context.item, text)}, // `matchesFile` is illustrative
    // });
    // const fileTree = tree({
    //   label: file => file.name,
    //   datasource: provideTreeDatasource<FileNode, string>(this._files, file => file.children ?? []),
    //   nodeActions: (toolbar, file) => toolbar
    //     .addToolbarButton({icon: 'download', tooltip: 'Download', visible: file.type === 'file', onSelect: () => downloadFile(file)}) // `downloadFile` is illustrative
    //     .addToolbarMenu({icon: 'more_vert', visualMenuIndicator: false}, menu => menu
    //       .addMenuItem({icon: 'edit', label: 'Rename', onSelect: () => renameFile(file)}) // `renameFile` is illustrative
    //       .addMenuItem({icon: 'share', label: 'Share', onSelect: () => shareFile(file)}) // `shareFile` is illustrative
    //       .addGroup(group => group
    //         .addMenuItem({icon: 'delete', label: 'Delete', onSelect: () => deleteFile(file)}), // `deleteFile` is illustrative
    //       ),
    //     ),
    // });
    const fileTree = tree({
      label: file => file.name,
      datasource: provideTreeDatasource<FileNode, string>(this._files, file => file.children ?? []),
      nodeBindings: (bindings, file, index) => bindings
        .addPartBinding(file.locked ? 'node:locked' : undefined) // <--- ::part binding
        .addPartBinding('node:abc') // <--- ::part binding
        .addAttributeBinding('data-filename', file.name), // <--- attribute binding
    });
  }

  private createTree(options: {slowDatasource: boolean}): SciTree<string> {
    return tree<FileNode, string>({
      label: item => item.name,
      datasource: this.getDataSource(options),
      trackBy: item => item.id,
      nodeBindings: (bindings, item) => {
        const extension = item.name.split('.').pop()!.toLowerCase();
        bindings.addIconBinding(item.children ? 'folder' : fileExtensionIcons.get(extension) ?? 'format_align_left');
        bindings.addPartBinding(item.locked ? 'node:locked' : undefined);
        bindings.addAttributeBinding('data-filename', item.name);
      },
      nodeActions: (toolbar, file) => toolbar
        .addToolbarButton({icon: 'download', tooltip: 'Download', visible: file.type === 'file', onSelect: () => downloadFile(file)}) // `downloadFile` is illustrative
        .addToolbarMenu({icon: 'more_vert', visualMenuIndicator: false}, menu => menu
          .addMenuItem({icon: 'edit', label: 'Rename', onSelect: () => renameFile(file)}) // `renameFile` is illustrative
          .addMenuItem({icon: 'share', label: 'Share', onSelect: () => shareFile(file)}) // `shareFile` is illustrative
          .addGroup(group => group
            .addMenuItem({icon: 'delete', label: 'Delete', onSelect: () => deleteFile(file)}), // `deleteFile` is illustrative
          ),
        ),
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

  private getDataSource(options: {slowDatasource: boolean}): SciTableDatasourceFactory<FileNode, string> {
    if (options.slowDatasource) {
      const nodes = this.getFileNodes(this._files());
      return provideAsyncTreeDatasource<FileNode, string>(
        request => timer(1000).pipe(map(() => nodes
          .filter(node => request.filter ? node.item.name.toLowerCase().includes(request.filter.toLowerCase()) : true)
          .map(node => ({item: node.item.id, parent: node.parent})))),
        ids => timer(1000).pipe(map(() => nodes.filter(node => ids.includes(node.item.id)).map(node => node.item))),
      );
    }

    return provideTreeDatasource<FileNode, string>(this._files, item => item.children);
  }

  private getFileNodes(files: FileNode[], parent?: string): SciTableTreeNode<FileNode, string>[] {
    return files.flatMap(item => [
      {item, parent},
      ...this.getFileNodes(item.children ?? [], item.id),
    ]);
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

  private createMethodsForm(): FieldTree<MethodsForm> {
    return form(signal<MethodsForm>({
      selectId: '',
    }));
  }

  protected onUserSettingsReset(): void {
    localStorage.removeItem('scion.components:tree:files');
    void this._router.navigate(['/']).then(() => this._router.navigate(['/sci-tree']));
  }

  protected updateSelectable(selectable: 'multi' | 'single' | 'false'): void {
    this.tree()?.selectable.set(selectable === 'false' ? false : selectable);
  }

  protected onSelect(): void {
    this.tree()?.select(this.methodsForm.selectId().value().split(' '));
    this.methodsForm.selectId().reset('');
  }

  protected onExpandAll(): void {
    this.tree()?.expandAll();
  }

  protected onCollapseAll(): void {
    this.tree()?.collapseAll();
  }

  protected onTreeFilter(filter: string): void {
    this.tree()!.filter(filter);
  }
}

interface SettingsForm {
  slowDatasource: boolean;
}

interface MethodsForm {
  selectId: string;
}

function matchesFile(a: FileNode, text: string): boolean {
  return true;
}

function downloadFile(file: FileNode): void {

}

function renameFile(file: FileNode): void {

}

function shareFile(file: FileNode): void {

}

function deleteFile(file: FileNode): void {

}

class FileComponent {
}
