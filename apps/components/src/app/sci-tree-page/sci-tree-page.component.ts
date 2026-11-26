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
import {provideTreeDatasource, SciTree, SciTreeComponent, tree, ɵprovideTreeDatasource} from '@scion/components/tree';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, required} from '@angular/forms/signals';
import {ɵcreateDestroyableInjector} from '@scion/components/common';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {createDesignTokenForm, DesignTokenForm, DesignTokenFormComponent} from '../styles/design-token-form.component';
import {SciTableDatasourceProvider} from '@scion/components/table';
import {map, timer} from 'rxjs';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {contributeMenu, SciMenuFactory} from '@scion/components/menu';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver} from '@angular/cdk/layout';
import {fileExtensionIcons, FileNode, FileService} from './file.service';
import {switchMap} from 'rxjs/operators';
import {FieldValidationDirective} from '../common/field-validation.directive';

@Component({
  selector: 'app-tree-page',
  templateUrl: './sci-tree-page.component.html',
  styleUrl: './sci-tree-page.component.scss',
  imports: [
    FormsModule,
    FormField,
    FormRoot,
    SciTabDirective,
    SciTabbarComponent,
    SciTreeComponent,
    DesignTokenFormComponent,
    SciFilterFieldComponent,
    FieldValidationDirective,
  ],
})
export default class SciTreePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _treeElement: Signal<ElementRef<HTMLElement> | undefined> = viewChild(SciTreeComponent, {read: ElementRef});
  private readonly _newFileDialog = viewChild.required<ElementRef<HTMLDialogElement>>('newFileDialog');
  private readonly _fileRenameDialog = viewChild.required<ElementRef<HTMLDialogElement>>('fileRenameDialog');
  private readonly _isMobile = toSignal(inject(BreakpointObserver).observe('(max-width: 700px)').pipe(map(breakpoint => breakpoint.matches)));
  private readonly _fileService = inject(FileService);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly designTokenForm: FieldTree<DesignTokenForm> = this.createDesignTokenForm();
  protected readonly newFileForm: FieldTree<NewFileForm> = this.createNewFileForm();
  protected readonly renameFileForm: FieldTree<RenameFileForm> = this.createRenameFileForm();

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

  public onNewFileCancel(): void {
    this._newFileDialog().nativeElement.close();
  }

  public onFileRenameCancel(): void {
    this._fileRenameDialog().nativeElement.close();
  }

  private createTree(options: {slowDatasource: boolean}): SciTree<string> {
    return tree<FileNode, string>({
      label: item => item.name,
      datasource: this.getDatasource(options),
      contextMenu: (menu, selection, activeItem) => this.createContextMenu(menu, selection, activeItem),
      trackBy: item => item.id,
      nodeBindings: (node, item) => {
        const extension = item.name.split('.').pop()!.toLowerCase();
        node.addIconBinding(item.type === 'folder' ? 'scion:folder' : fileExtensionIcons.get(extension) ?? 'format_align_left');
      },
    });
  }

  private createContextMenu(menu: SciMenuFactory, selection: string[], activeItem: string | undefined): void {
    const activeFile = this._fileService.getFile(activeItem);

    menu
      .addGroup(menu => menu
        .addMenu({label: 'New'}, menu => menu
          .addMenuItem({label: 'File', icon: 'format_align_left', onSelect: () => this.newFile(activeFile, 'file')})
          .addMenuItem({label: 'Folder', icon: 'scion:folder', onSelect: () => this.newFile(activeFile, 'folder')}),
        ),
      )
      .addGroup(menu => menu
        .addMenuItem({label: 'Copy', icon: 'scion:copy', disabled: activeFile === undefined, onSelect: () => this.copyFiles(selection), accelerator: {key: 'C', ctrl: true}})
        .addMenuItem({label: 'Copy Path', disabled: activeFile === undefined, onSelect: () => this.copyFilePath(activeFile!)})
        .addMenuItem({label: 'Paste', icon: 'scion:copy', disabled: computed(() => !this._fileService.canPaste()), onSelect: () => this.pasteFiles(activeFile, selection), accelerator: {key: 'V', ctrl: true}}),
      )
      .addGroup(menu => menu.addMenuItem({label: 'Rename...', icon: 'scion:edit', disabled: activeFile === undefined, onSelect: () => this.renameFile(activeFile!), accelerator: {key: 'F2'}}))
      .addGroup(menu => menu.addMenuItem({label: 'Delete', icon: 'scion:delete', disabled: selection.length === 0, onSelect: () => this._fileService.deleteFiles(selection), accelerator: {key: 'Delete'}}));
  }

  private newFile(file: FileNode | undefined, type: 'file' | 'folder'): void {
    const parentId = file?.type === 'folder' ? file.id : file?.parentId;
    this.newFileForm.parentId().value.set(parentId ?? null);
    this.newFileForm.type().value.set(type);
    this._newFileDialog().nativeElement.showModal();
  }

  private renameFile(file: FileNode): void {
    this.renameFileForm.id().value.set(file.id);
    this.renameFileForm.name().value.set(file.name);
    this._fileRenameDialog().nativeElement.showModal();
  }

  private copyFiles(selection: string[]): void {
    const files = selection
      .map(id => this._fileService.getFile(id))
      .filter(file => !!file);

    const selectedFolders = new Set(files.filter(file => file.type === 'folder').map(file => file.id));

    const filesToCopy = files.filter(file => {
      let parentId = file.parentId;

      while (parentId) {
        if (selectedFolders.has(parentId)) {
          return false;
        }

        parentId = this._fileService.getFile(parentId)?.parentId;
      }

      return true;
    });

    this._fileService.copyFiles(filesToCopy);
  }

  private pasteFiles(activeFile: FileNode | undefined, selection: string[]): void {
    const activeItem = activeFile && selection.includes(activeFile.id) ? this._fileService.getFile(activeFile.id) : undefined;
    const parentId = activeItem?.type === 'folder' ? activeItem.id : activeItem?.parentId;
    this._fileService.pasteFiles(parentId);
  }

  private copyFilePath(file: FileNode): void {
    void navigator.clipboard.writeText(this._fileService.getFilePath(file.id));
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
      return ɵprovideTreeDatasource<FileNode, string>({
        getTreeNodes: query => timer(1000).pipe(switchMap(() => this._fileService.getTreeFileNodes$(query))),
        getItems: ids => timer(1000).pipe(switchMap(() => this._fileService.getFileNodes$(ids))),
      });
    }

    return provideTreeDatasource<FileNode>(this._fileService.files, item => item.children);
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

  private createRenameFileForm(): FieldTree<RenameFileForm> {
    const fileService = inject(FileService);

    const defaults: RenameFileForm = {
      id: '',
      name: '',
    };

    return form(signal(defaults), file => {
      required(file.id);
      required(file.name);
    }, {
      submission: {
        action: async form => {
          fileService.editFile(form().value().id, form().value().name);
          this.renameFileForm().reset(defaults);
          this._fileRenameDialog().nativeElement.close();
        },
      },
    });
  }

  private createNewFileForm(): FieldTree<NewFileForm> {
    const fileService = inject(FileService);

    const defaults: NewFileForm = {
      parentId: null,
      type: 'file',
      name: '',
    };

    return form(signal(defaults), file => {
      required(file.name);
    }, {
      submission: {
        action: async form => {
          fileService.createFile(form().value().name, {parentId: form().value().parentId ?? undefined, type: form().value().type});
          this.newFileForm().reset(defaults);
          this._newFileDialog().nativeElement.close();
        },
      },
    });
  }

  private contributeMainToolbarMenu(): void {
    contributeMenu('toolbar:main', toolbar => toolbar
      .addToolbarButton({visible: this.panelOpen, icon: 'right_panel_close', tooltip: 'Hide side panel', onSelect: () => this.panelOpen.set(false)})
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

export interface NewFileForm {
  parentId: string | null;
  type: 'file' | 'folder';
  name: string;
}

export interface RenameFileForm {
  id: string;
  name: string;
}
